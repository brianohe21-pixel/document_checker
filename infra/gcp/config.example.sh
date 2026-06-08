#!/usr/bin/env bash
# Copy to config.sh and fill in your values:
#   cp infra/gcp/config.example.sh infra/gcp/config.sh

export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="us-central1"

export GCP_ARTIFACT_REPO="certchain"
export GCP_SQL_INSTANCE="certchain-db"
export GCP_DB_NAME="certchain"
export GCP_DB_USER="certchain"

# ENTERPRISE + db-f1-micro (low cost). For ENTERPRISE_PLUS use tier db-perf-optimized-N-2
export GCP_SQL_EDITION="ENTERPRISE"
export GCP_SQL_TIER="db-f1-micro"

export GCP_API_SERVICE="certchain-api"
export GCP_WEB_SERVICE="certchain-web"

# Set after first deploy or use your custom domains
export GCP_API_URL=""
export GCP_WEB_URL=""
export PUBLIC_VERIFY_URL=""
export CORS_ORIGIN=""
