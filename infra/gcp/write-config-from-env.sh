#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
: "${GCP_REGION:?GCP_REGION is required}"

export GCP_ARTIFACT_REPO="${GCP_ARTIFACT_REPO:-certchain}"
export GCP_SQL_INSTANCE="${GCP_SQL_INSTANCE:-certchain-db}"
export GCP_DB_NAME="${GCP_DB_NAME:-certchain}"
export GCP_DB_USER="${GCP_DB_USER:-certchain}"
export GCP_API_SERVICE="${GCP_API_SERVICE:-certchain-api}"
export GCP_WEB_SERVICE="${GCP_WEB_SERVICE:-certchain-web}"
export GCP_API_URL="${GCP_API_URL:-}"
export GCP_WEB_URL="${GCP_WEB_URL:-}"
export PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL:-}"
export CORS_ORIGIN="${CORS_ORIGIN:-}"

CONFIG_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config.sh"

cat > "${CONFIG_PATH}" <<EOF
export GCP_PROJECT_ID="${GCP_PROJECT_ID}"
export GCP_REGION="${GCP_REGION}"
export GCP_ARTIFACT_REPO="${GCP_ARTIFACT_REPO}"
export GCP_SQL_INSTANCE="${GCP_SQL_INSTANCE}"
export GCP_DB_NAME="${GCP_DB_NAME}"
export GCP_DB_USER="${GCP_DB_USER}"
export GCP_API_SERVICE="${GCP_API_SERVICE}"
export GCP_WEB_SERVICE="${GCP_WEB_SERVICE}"
export GCP_API_URL="${GCP_API_URL}"
export GCP_WEB_URL="${GCP_WEB_URL}"
export PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL}"
export CORS_ORIGIN="${CORS_ORIGIN}"
EOF

echo "Wrote ${CONFIG_PATH} from environment variables"
