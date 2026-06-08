#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f infra/gcp/config.sh ]]; then
  echo "Create infra/gcp/config.sh from infra/gcp/config.example.sh"
  exit 1
fi

# shellcheck source=/dev/null
source infra/gcp/config.sh

: "${GCP_PROJECT_ID:?}"
: "${GCP_REGION:?}"
: "${GCP_ARTIFACT_REPO:?}"
: "${GCP_SQL_INSTANCE:?}"
: "${GCP_API_SERVICE:?}"
: "${GCP_WEB_SERVICE:?}"

TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
CONNECTION_NAME="$(gcloud sql instances describe "${GCP_SQL_INSTANCE}" --format='value(connectionName)')"

gcloud config set project "${GCP_PROJECT_ID}"

if [[ -z "${GCP_API_URL:-}" ]]; then
  echo "==> Building and pushing API image..."
  gcloud builds submit \
    --config=infra/gcp/cloudbuild-api.yaml \
    --substitutions="_REGION=${GCP_REGION},_ARTIFACT_REPO=${GCP_ARTIFACT_REPO},_TAG=${TAG}"

  echo "==> Deploying API to Cloud Run..."
  gcloud run deploy "${GCP_API_SERVICE}" \
    --image="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}/api:${TAG}" \
    --region="${GCP_REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --add-cloudsql-instances="${CONNECTION_NAME}" \
    --set-secrets="DATABASE_URL=certchain-database-url:latest,JWT_SECRET=certchain-jwt-secret:latest,ADMIN_EMAIL=certchain-admin-email:latest,ADMIN_PASSWORD=certchain-admin-password:latest,RPC_URL=certchain-rpc-url:latest,PRIVATE_KEY=certchain-private-key:latest,CONTRACT_ADDRESS=certchain-contract-address:latest" \
    --set-env-vars="JWT_EXPIRES_IN=24h"

  GCP_API_URL="$(gcloud run services describe "${GCP_API_SERVICE}" --region="${GCP_REGION}" --format='value(status.url)')"
  echo "API URL: ${GCP_API_URL}"
else
  echo "==> Using configured GCP_API_URL: ${GCP_API_URL}"
  gcloud builds submit \
    --config=infra/gcp/cloudbuild-api.yaml \
    --substitutions="_REGION=${GCP_REGION},_ARTIFACT_REPO=${GCP_ARTIFACT_REPO},_TAG=${TAG}"

  gcloud run deploy "${GCP_API_SERVICE}" \
    --image="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}/api:${TAG}" \
    --region="${GCP_REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --add-cloudsql-instances="${CONNECTION_NAME}" \
    --set-secrets="DATABASE_URL=certchain-database-url:latest,JWT_SECRET=certchain-jwt-secret:latest,ADMIN_EMAIL=certchain-admin-email:latest,ADMIN_PASSWORD=certchain-admin-password:latest,RPC_URL=certchain-rpc-url:latest,PRIVATE_KEY=certchain-private-key:latest,CONTRACT_ADDRESS=certchain-contract-address:latest" \
    --set-env-vars="JWT_EXPIRES_IN=24h,CORS_ORIGIN=${CORS_ORIGIN:-}"
fi

if [[ -z "${GCP_WEB_URL:-}" ]]; then
  GCP_WEB_URL="$(gcloud run services describe "${GCP_WEB_SERVICE}" --region="${GCP_REGION}" --format='value(status.url)' 2>/dev/null || true)"
fi

PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL:-${GCP_WEB_URL}/verify}"
CORS_ORIGIN="${CORS_ORIGIN:-${GCP_WEB_URL}}"

gcloud run services update "${GCP_API_SERVICE}" \
  --region="${GCP_REGION}" \
  --update-env-vars="CORS_ORIGIN=${CORS_ORIGIN},PUBLIC_VERIFY_URL=${PUBLIC_VERIFY_URL}"

echo "==> Building and pushing Web image..."
gcloud builds submit \
  --config=infra/gcp/cloudbuild-web.yaml \
  --substitutions="_REGION=${GCP_REGION},_ARTIFACT_REPO=${GCP_ARTIFACT_REPO},_TAG=${TAG},_NEXT_PUBLIC_API_URL=${GCP_API_URL}"

echo "==> Deploying Web to Cloud Run..."
gcloud run deploy "${GCP_WEB_SERVICE}" \
  --image="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}/web:${TAG}" \
  --region="${GCP_REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3

GCP_WEB_URL="$(gcloud run services describe "${GCP_WEB_SERVICE}" --region="${GCP_REGION}" --format='value(status.url)')"
PUBLIC_VERIFY_URL="${GCP_WEB_URL}/verify"

gcloud run services update "${GCP_API_SERVICE}" \
  --region="${GCP_REGION}" \
  --update-env-vars="CORS_ORIGIN=${GCP_WEB_URL},PUBLIC_VERIFY_URL=${PUBLIC_VERIFY_URL}"

echo ""
echo "=========================================="
echo "Deployment complete"
echo "=========================================="
echo "Web:    ${GCP_WEB_URL}"
echo "API:    ${GCP_API_URL}"
echo "Verify: ${PUBLIC_VERIFY_URL}/{certificateId}"
echo "Swagger: ${GCP_API_URL}/api/docs"
echo ""
echo "Run database seed (first time only):"
echo "  ./infra/gcp/seed.sh"
