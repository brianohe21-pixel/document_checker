#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ -f infra/gcp/config.sh ]]; then
  # shellcheck source=/dev/null
  source infra/gcp/config.sh
fi

GCP_PROJECT_ID="${GCP_PROJECT_ID:-certchain-open}"
SA_NAME="${SA_NAME:-github-actions-deploy}"
POOL_ID="${POOL_ID:-github}"
PROVIDER_ID="${PROVIDER_ID:-github}"
GITHUB_REPO="${GITHUB_REPO:-brianohe21-pixel/document_checker}"
GITHUB_OWNER="${GITHUB_OWNER:-${GITHUB_REPO%%/*}}"

SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

export PATH="${PATH}:${HOME}/google-cloud-sdk/bin"

gcloud config set project "${GCP_PROJECT_ID}" --quiet

PROJECT_NUMBER="$(gcloud projects describe "${GCP_PROJECT_ID}" --format='value(projectNumber)')"

echo "==> Ensuring service account exists: ${SA_EMAIL}"
if ! gcloud iam service-accounts describe "${SA_EMAIL}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="GitHub Actions Deploy"
fi

echo "==> Granting deploy roles..."
for ROLE in \
  roles/run.admin \
  roles/cloudbuild.builds.editor \
  roles/artifactregistry.writer \
  roles/iam.serviceAccountUser \
  roles/storage.admin \
  roles/cloudsql.viewer
do
  gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --quiet >/dev/null
done

echo "==> Creating Workload Identity Pool (if missing)..."
if ! gcloud iam workload-identity-pools describe "${POOL_ID}" \
  --location="global" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "${POOL_ID}" \
    --location="global" \
    --display-name="GitHub Actions"
fi

echo "==> Creating OIDC provider (if missing)..."
if ! gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_ID}" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
    --location="global" \
    --workload-identity-pool="${POOL_ID}" \
    --display-name="GitHub" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --attribute-condition="assertion.repository_owner == '${GITHUB_OWNER}' && assertion.repository == '${GITHUB_REPO}'" \
    --issuer-uri="https://token.actions.githubusercontent.com"
fi

echo "==> Allowing GitHub repo to impersonate service account..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}" \
  --quiet >/dev/null

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

echo ""
echo "=========================================="
echo "Workload Identity Federation ready"
echo "=========================================="
echo ""
echo "Add these GitHub repository variables:"
echo ""
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=${WIF_PROVIDER}"
echo "GCP_SERVICE_ACCOUNT=${SA_EMAIL}"
echo ""
echo "Remove GCP_SA_KEY if you created it (not needed with WIF)."
echo ""
