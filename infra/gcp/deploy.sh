#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f infra/gcp/config.sh ]]; then
  if [[ -n "${GCP_PROJECT_ID:-}" ]]; then
    bash infra/gcp/write-config-from-env.sh
  else
    echo "Create infra/gcp/config.sh from infra/gcp/config.example.sh"
    exit 1
  fi
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
API_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}/api:${TAG}"
WEB_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPO}/web:${TAG}"

API_SECRETS="DATABASE_URL=certchain-database-url:latest,JWT_SECRET=certchain-jwt-secret:latest,ADMIN_EMAIL=certchain-admin-email:latest,ADMIN_PASSWORD=certchain-admin-password:latest,RPC_URL=certchain-rpc-url:latest,PRIVATE_KEY=certchain-private-key:latest,CONTRACT_ADDRESS=certchain-contract-address:latest,RESEND_API_KEY=certchain-resend-api-key:latest,EMAIL_FROM=certchain-email-from:latest"

donate_substitutions() {
  printf '_NEXT_PUBLIC_DONATE_GITHUB_URL=%s,_NEXT_PUBLIC_DONATE_CRYPTO_ADDRESS=%s,_NEXT_PUBLIC_DONATE_CRYPTO_LABEL=%s,_NEXT_PUBLIC_DONATE_KOFI_URL=%s,_NEXT_PUBLIC_CONTACT_NAME=%s,_NEXT_PUBLIC_CONTACT_WHATSAPP=%s,_NEXT_PUBLIC_ADMIN_URL=%s' \
    "${NEXT_PUBLIC_DONATE_GITHUB_URL:-}" \
    "${NEXT_PUBLIC_DONATE_CRYPTO_ADDRESS:-}" \
    "${NEXT_PUBLIC_DONATE_CRYPTO_LABEL:-}" \
    "${NEXT_PUBLIC_DONATE_KOFI_URL:-}" \
    "${NEXT_PUBLIC_CONTACT_NAME:-}" \
    "${NEXT_PUBLIC_CONTACT_WHATSAPP:-}" \
    "${ADMIN_URL:-http://localhost:3002}"
}

deploy_api() {
  gcloud run deploy "${GCP_API_SERVICE}" \
    --image="${API_IMAGE}" \
    --region="${GCP_REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --add-cloudsql-instances="${CONNECTION_NAME}" \
    --set-secrets="${API_SECRETS}" \
    --set-env-vars="JWT_EXPIRES_IN=24h${1:-}"
}

deploy_web() {
  gcloud run deploy "${GCP_WEB_SERVICE}" \
    --image="${WEB_IMAGE}" \
    --region="${GCP_REGION}" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3
}

update_api_cors() {
  gcloud run services update "${GCP_API_SERVICE}" \
    --region="${GCP_REGION}" \
    --update-env-vars="CORS_ORIGIN=${1},PUBLIC_VERIFY_URL=${2},EMAIL_FROM=${3:-CertChain <onboarding@resend.dev>}"
}

gcloud config set project "${GCP_PROJECT_ID}" --quiet

if [[ -n "${GCP_API_URL:-}" ]]; then
  echo "==> Fast deploy: building API and Web images in parallel (single Cloud Build)..."
  gcloud builds submit \
    --config=infra/gcp/cloudbuild-all.yaml \
    --substitutions="_REGION=${GCP_REGION},_ARTIFACT_REPO=${GCP_ARTIFACT_REPO},_TAG=${TAG},_NEXT_PUBLIC_API_URL=${GCP_API_URL},$(donate_substitutions)"

  echo "==> Deploying API and Web to Cloud Run in parallel..."
  deploy_api "" &
  API_DEPLOY_PID=$!
  deploy_web &
  WEB_DEPLOY_PID=$!
  wait "${API_DEPLOY_PID}"
  wait "${WEB_DEPLOY_PID}"

  GCP_API_URL="${GCP_API_URL}"
  if [[ -z "${GCP_WEB_URL:-}" ]]; then
    GCP_WEB_URL="$(gcloud run services describe "${GCP_WEB_SERVICE}" --region="${GCP_REGION}" --format='value(status.url)')"
  fi
else
  echo "==> Building and pushing API image..."
  gcloud builds submit \
    --config=infra/gcp/cloudbuild-api.yaml \
    --substitutions="_REGION=${GCP_REGION},_ARTIFACT_REPO=${GCP_ARTIFACT_REPO},_TAG=${TAG}"

  echo "==> Deploying API to Cloud Run..."
  deploy_api
  GCP_API_URL="$(gcloud run services describe "${GCP_API_SERVICE}" --region="${GCP_REGION}" --format='value(status.url)')"
  echo "API URL: ${GCP_API_URL}"

  if [[ -z "${GCP_WEB_URL:-}" ]]; then
    GCP_WEB_URL="$(gcloud run services describe "${GCP_WEB_SERVICE}" --region="${GCP_REGION}" --format='value(status.url)' 2>/dev/null || true)"
  fi

  PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL:-${GCP_WEB_URL}/verify}"
  CORS_ORIGIN="${CORS_ORIGIN:-${GCP_WEB_URL}}"
  if [[ -n "${ADMIN_URL:-}" ]]; then
    CORS_ORIGIN="${CORS_ORIGIN},${ADMIN_URL}"
  fi
  update_api_cors "${CORS_ORIGIN}" "${PUBLIC_VERIFY_URL}" "${EMAIL_FROM:-}"

  echo "==> Building and pushing Web image..."
  gcloud builds submit \
    --config=infra/gcp/cloudbuild-web.yaml \
    --substitutions="_REGION=${GCP_REGION},_ARTIFACT_REPO=${GCP_ARTIFACT_REPO},_TAG=${TAG},_NEXT_PUBLIC_API_URL=${GCP_API_URL},$(donate_substitutions)"

  echo "==> Deploying Web to Cloud Run..."
  deploy_web
  GCP_WEB_URL="$(gcloud run services describe "${GCP_WEB_SERVICE}" --region="${GCP_REGION}" --format='value(status.url)')"
fi

PUBLIC_VERIFY_URL="${GCP_WEB_URL}/verify"
FINAL_CORS="${GCP_WEB_URL}"
if [[ -n "${ADMIN_URL:-}" ]]; then
  FINAL_CORS="${FINAL_CORS},${ADMIN_URL}"
fi
update_api_cors "${FINAL_CORS}" "${PUBLIC_VERIFY_URL}" "${EMAIL_FROM:-}"

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
