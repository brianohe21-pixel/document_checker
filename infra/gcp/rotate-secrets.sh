#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f infra/gcp/secrets.env ]]; then
  echo "Edit infra/gcp/secrets.env with new values, then run this script."
  exit 1
fi

# shellcheck source=/dev/null
source infra/gcp/secrets.env

# shellcheck source=/dev/null
source infra/gcp/config.sh

update_secret() {
  local name="$1"
  local value="$2"
  printf '%s' "${value}" | gcloud secrets versions add "${name}" --data-file=-
  echo "Updated secret: ${name}"
}

echo "==> Rotating secrets in Google Secret Manager..."
update_secret certchain-jwt-secret "${JWT_SECRET}"
update_secret certchain-admin-email "${ADMIN_EMAIL}"
update_secret certchain-admin-password "${ADMIN_PASSWORD}"
update_secret certchain-rpc-url "${RPC_URL}"
update_secret certchain-private-key "${PRIVATE_KEY}"
update_secret certchain-contract-address "${CONTRACT_ADDRESS}"
update_secret certchain-resend-api-key "${RESEND_API_KEY:-}"
update_secret certchain-email-from "${EMAIL_FROM:-CertChain <onboarding@resend.dev>}"

if [[ -n "${DB_PASSWORD:-}" ]]; then
  CONNECTION_NAME="$(gcloud sql instances describe "${GCP_SQL_INSTANCE}" --format='value(connectionName)')"
  DATABASE_URL="postgresql://${GCP_DB_USER}:${DB_PASSWORD}@/${GCP_DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
  gcloud sql users set-password "${GCP_DB_USER}" \
    --instance="${GCP_SQL_INSTANCE}" \
    --password="${DB_PASSWORD}"
  update_secret certchain-database-url "${DATABASE_URL}"
fi

echo "==> Redeploying API to pick up new secret versions..."
gcloud run services update "${GCP_API_SERVICE}" --region="${GCP_REGION}" --quiet

echo "Done. Run pnpm deploy:gcp:seed if admin credentials changed."
