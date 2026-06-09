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

if [[ ! -f infra/gcp/secrets.env ]]; then
  echo "Create infra/gcp/secrets.env from infra/gcp/secrets.env.example"
  exit 1
fi

# shellcheck source=/dev/null
source infra/gcp/secrets.env
# shellcheck source=/dev/null
source infra/gcp/lib.sh

: "${GCP_PROJECT_ID:?}"
: "${GCP_REGION:?}"
: "${GCP_ARTIFACT_REPO:?}"
: "${GCP_SQL_INSTANCE:?}"
: "${GCP_DB_NAME:?}"
: "${GCP_DB_USER:?}"

GCP_SQL_EDITION="${GCP_SQL_EDITION:-ENTERPRISE}"
GCP_SQL_TIER="${GCP_SQL_TIER:-db-f1-micro}"

echo "==> Setting GCP project: ${GCP_PROJECT_ID}"
gcloud config set project "${GCP_PROJECT_ID}"

echo "==> Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  storage.googleapis.com

echo "==> Creating Artifact Registry repository..."
if ! gcloud artifacts repositories describe "${GCP_ARTIFACT_REPO}" \
  --location="${GCP_REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${GCP_ARTIFACT_REPO}" \
    --repository-format=docker \
    --location="${GCP_REGION}" \
    --description="CertChain Open containers"
fi

echo "==> Creating Cloud SQL instance (this can take several minutes)..."
if ! gcloud sql instances describe "${GCP_SQL_INSTANCE}" >/dev/null 2>&1; then
  DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)}"
  echo "Generated DB password (save it): ${DB_PASSWORD}"
  gcloud sql instances create "${GCP_SQL_INSTANCE}" \
    --database-version=POSTGRES_16 \
    --edition="${GCP_SQL_EDITION}" \
    --tier="${GCP_SQL_TIER}" \
    --region="${GCP_REGION}" \
    --root-password="${DB_PASSWORD}" \
    --storage-auto-increase \
    --backup
else
  echo "Cloud SQL instance already exists."
  if [[ -z "${DB_PASSWORD:-}" ]]; then
    echo "Set DB_PASSWORD in secrets.env if you need to recreate the database user."
  fi
fi

echo "==> Creating database and user..."
gcloud sql databases create "${GCP_DB_NAME}" \
  --instance="${GCP_SQL_INSTANCE}" 2>/dev/null || echo "Database may already exist."

if [[ -n "${DB_PASSWORD:-}" ]]; then
  gcloud sql users create "${GCP_DB_USER}" \
    --instance="${GCP_SQL_INSTANCE}" \
    --password="${DB_PASSWORD}" 2>/dev/null || \
  gcloud sql users set-password "${GCP_DB_USER}" \
    --instance="${GCP_SQL_INSTANCE}" \
    --password="${DB_PASSWORD}"
fi

CONNECTION_NAME="$(gcloud sql instances describe "${GCP_SQL_INSTANCE}" --format='value(connectionName)')"
if [[ -n "${DB_PASSWORD:-}" ]]; then
  DATABASE_URL="$(build_cloudsql_database_url "${GCP_DB_USER}" "${DB_PASSWORD}" "${GCP_DB_NAME}" "${CONNECTION_NAME}")"
else
  echo "WARNING: DB_PASSWORD not set. DATABASE_URL secret must be created manually."
  DATABASE_URL=""
fi

create_or_update_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "${name}" >/dev/null 2>&1; then
    printf '%s' "${value}" | gcloud secrets versions add "${name}" --data-file=-
  else
    printf '%s' "${value}" | gcloud secrets create "${name}" --data-file=-
  fi
}

echo "==> Creating/updating secrets in Secret Manager..."
create_or_update_secret certchain-jwt-secret "${JWT_SECRET}"
create_or_update_secret certchain-admin-email "${ADMIN_EMAIL}"
create_or_update_secret certchain-admin-password "${ADMIN_PASSWORD}"
create_or_update_secret certchain-rpc-url "${RPC_URL}"
create_or_update_secret certchain-private-key "${PRIVATE_KEY}"
create_or_update_secret certchain-contract-address "${CONTRACT_ADDRESS}"
create_or_update_secret certchain-resend-api-key "${RESEND_API_KEY:-}"
create_or_update_secret certchain-email-from "${EMAIL_FROM:-CertChain <onboarding@resend.dev>}"

if [[ -n "${DATABASE_URL}" ]]; then
  create_or_update_secret certchain-database-url "${DATABASE_URL}"
fi

PROJECT_NUMBER="$(gcloud projects describe "${GCP_PROJECT_ID}" --format='value(projectNumber)')"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "==> Granting IAM permissions for Cloud Run, Cloud Build, and Cloud SQL..."

grant_role() {
  local member="$1"
  local role="$2"
  gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
    --member="${member}" \
    --role="${role}" >/dev/null 2>&1 || true
}

grant_role "serviceAccount:${COMPUTE_SA}" "roles/cloudsql.client"
grant_role "serviceAccount:${COMPUTE_SA}" "roles/cloudbuild.builds.builder"
grant_role "serviceAccount:${COMPUTE_SA}" "roles/storage.objectViewer"
grant_role "serviceAccount:${COMPUTE_SA}" "roles/artifactregistry.writer"
grant_role "serviceAccount:${COMPUTE_SA}" "roles/logging.logWriter"

grant_role "serviceAccount:${CLOUD_BUILD_SA}" "roles/storage.admin"
grant_role "serviceAccount:${CLOUD_BUILD_SA}" "roles/artifactregistry.writer"
grant_role "serviceAccount:${CLOUD_BUILD_SA}" "roles/run.admin"
grant_role "serviceAccount:${CLOUD_BUILD_SA}" "roles/iam.serviceAccountUser"

for secret in certchain-jwt-secret certchain-admin-email certchain-admin-password certchain-rpc-url certchain-private-key certchain-contract-address certchain-resend-api-key certchain-email-from certchain-database-url; do
  if gcloud secrets describe "${secret}" >/dev/null 2>&1; then
    gcloud secrets add-iam-policy-binding "${secret}" \
      --member="serviceAccount:${COMPUTE_SA}" \
      --role="roles/secretmanager.secretAccessor" >/dev/null 2>&1 || true
  fi
done

echo ""
echo "Setup complete."
echo "Cloud SQL connection: ${CONNECTION_NAME}"
echo "Next step: ./infra/gcp/deploy.sh"
