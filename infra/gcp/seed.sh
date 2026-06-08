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
: "${GCP_SQL_INSTANCE:?}"
: "${GCP_DB_NAME:?}"
: "${GCP_DB_USER:?}"

gcloud config set project "${GCP_PROJECT_ID}" --quiet

CONNECTION_NAME="$(gcloud sql instances describe "${GCP_SQL_INSTANCE}" --format='value(connectionName)')"
PROXY_BIN="${ROOT_DIR}/infra/gcp/cloud-sql-proxy"
PROXY_PORT="${PROXY_PORT:-15432}"

if [[ ! -f infra/gcp/secrets.env ]]; then
  echo "Create infra/gcp/secrets.env from infra/gcp/secrets.env.example"
  exit 1
fi

# shellcheck source=/dev/null
source infra/gcp/secrets.env
# shellcheck source=/dev/null
source infra/gcp/lib.sh

: "${DB_PASSWORD:?Set DB_PASSWORD in infra/gcp/secrets.env}"
: "${ADMIN_EMAIL:?Set ADMIN_EMAIL in infra/gcp/secrets.env}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD in infra/gcp/secrets.env}"

if (echo >/dev/tcp/127.0.0.1/"${PROXY_PORT}") 2>/dev/null; then
  echo "Port ${PROXY_PORT} is already in use. Set PROXY_PORT to another value or stop the process using it."
  exit 1
fi

if [[ ! -x "${PROXY_BIN}" ]]; then
  echo "Downloading Cloud SQL Auth Proxy..."
  curl -fsSL -o "${PROXY_BIN}" \
    https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.linux.amd64
  chmod +x "${PROXY_BIN}"
fi

echo "==> Syncing Cloud SQL user password from secrets.env..."
gcloud sql users set-password "${GCP_DB_USER}" \
  --instance="${GCP_SQL_INSTANCE}" \
  --password="${DB_PASSWORD}" \
  --quiet

DATABASE_URL="$(build_local_database_url "${GCP_DB_USER}" "${DB_PASSWORD}" "${GCP_DB_NAME}" "${PROXY_PORT}")"

echo "==> Starting Cloud SQL Auth Proxy on port ${PROXY_PORT}..."
"${PROXY_BIN}" "${CONNECTION_NAME}" --port "${PROXY_PORT}" &
PROXY_PID=$!
trap 'kill ${PROXY_PID} 2>/dev/null || true' EXIT

ready=0
for _ in $(seq 1 30); do
  if ! kill -0 "${PROXY_PID}" 2>/dev/null; then
    echo "Cloud SQL Auth Proxy exited unexpectedly. Check gcloud auth and instance name."
    exit 1
  fi
  if (echo >/dev/tcp/127.0.0.1/"${PROXY_PORT}") 2>/dev/null; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "${ready}" -ne 1 ]]; then
  echo "Cloud SQL Auth Proxy did not become ready on port ${PROXY_PORT} within 30s"
  exit 1
fi

echo "==> Running migrations and admin seed..."
cd apps/api
export DATABASE_URL ADMIN_EMAIL ADMIN_PASSWORD
npx prisma generate
DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy
DATABASE_URL="${DATABASE_URL}" ADMIN_EMAIL="${ADMIN_EMAIL}" ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
  npx ts-node --project tsconfig.seed.json prisma/seed.ts

echo "Seed completed."
