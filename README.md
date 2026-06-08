# CertChain Open

Open source platform for issuing and verifying academic certificates on blockchain.

## Features

- Issue digital certificates with PDF generation and QR codes
- Register SHA-256 document hashes on Polygon Amoy testnet
- Public certificate verification without authentication
- JWT-protected admin issuance API
- PolygonScan integration for transaction exploration

## Architecture

```
apps/web        → Next.js 15 frontend
apps/api        → NestJS backend (hexagonal architecture)
packages/contracts → Solidity smart contracts (Hardhat)
packages/shared → Shared TypeScript types and ABI
```

## Requirements

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (optional)
- Polygon Amoy testnet wallet with MATIC (for blockchain operations)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable              | Description                          |
| --------------------- | ------------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string         |
| `JWT_SECRET`          | Secret for JWT signing               |
| `ADMIN_EMAIL`         | Admin user email for seed            |
| `ADMIN_PASSWORD`      | Admin user password for seed         |
| `RPC_URL`             | Polygon Amoy RPC endpoint            |
| `PRIVATE_KEY`         | Issuer wallet private key            |
| `CONTRACT_ADDRESS`    | Deployed CertificateRegistry address |
| `PUBLIC_VERIFY_URL`   | Base URL for QR codes                |
| `NEXT_PUBLIC_API_URL` | API URL for frontend                 |

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Database setup

```bash
cd apps/api
pnpm prisma:migrate:deploy
pnpm prisma:seed
```

### 5. Deploy smart contract (Polygon Amoy)

1. Get test MATIC from a [Polygon Amoy faucet](https://faucet.polygon.technology/)
2. Add to `.env` (use a dedicated wallet, not the Hardhat dev key):

```
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
AMOY_PRIVATE_KEY=0xYourFundedWalletPrivateKey
```

3. Deploy:

```bash
pnpm --filter @certchain/contracts build
pnpm --filter @certchain/contracts deploy:amoy
```

4. Copy the deployed address to `CONTRACT_ADDRESS` in `.env`
5. For production API, also set `RPC_URL` and `PRIVATE_KEY` to the same Amoy RPC and issuer wallet

### 6. Run development servers

```bash
pnpm dev
```

The local Hardhat node auto-deploys the contract on startup. The API waits for it before starting.

If you need to redeploy manually:

```bash
pnpm setup:local-blockchain
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

## Docker

Run the full stack:

```bash
docker compose up --build
```

## Deploy to Google Cloud

### Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- A GCP project with billing enabled
- Smart contract deployed on Polygon Amoy (`CONTRACT_ADDRESS`)
- Wallet funded with Amoy MATIC

### 1. Configure deployment files

```bash
cp infra/gcp/config.example.sh infra/gcp/config.sh
cp infra/gcp/secrets.env.example infra/gcp/secrets.env
```

Edit `infra/gcp/config.sh` with your `GCP_PROJECT_ID` and `GCP_REGION`.

Edit `infra/gcp/secrets.env` with production secrets (`DB_PASSWORD`, `JWT_SECRET`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, etc.).

### 2. Login and provision infrastructure

```bash
gcloud auth login
gcloud auth application-default login
pnpm deploy:gcp:setup
```

This creates Artifact Registry, Cloud SQL (PostgreSQL 16), and Secret Manager entries.

### 3. Deploy to Cloud Run

Manual deploy:

```bash
pnpm deploy:gcp
```

### 4. CI/CD deploy on `main`

CI runs on `develop` and `main`. Every push to `main` runs tests and, if they pass, deploys to Cloud Run.

**One-time GCP setup (Workload Identity Federation)**

JSON keys are blocked on this project (`iam.disableServiceAccountKeyCreation`). Use WIF instead:

```bash
bash infra/gcp/setup-github-wif.sh
```

The script prints two values to add as GitHub variables.

**GitHub repository variables** (Settings → Secrets and variables → Actions → Variables)

| Name                             | Example                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github/providers/github` |
| `GCP_SERVICE_ACCOUNT`            | `github-actions-deploy@certchain-open.iam.gserviceaccount.com`                      |
| `GCP_PROJECT_ID`                 | `certchain-open`                                                                    |
| `GCP_REGION`                     | `us-central1`                                                                       |
| `GCP_ARTIFACT_REPO`              | `certchain`                                                                         |
| `GCP_SQL_INSTANCE`               | `certchain-db`                                                                      |
| `GCP_API_SERVICE`                | `certchain-api`                                                                     |
| `GCP_WEB_SERVICE`                | `certchain-web`                                                                     |

Optional (leave empty to auto-detect Cloud Run URLs):

| Name                | Example                                    |
| ------------------- | ------------------------------------------ |
| `GCP_API_URL`       | `https://certchain-api-xxx.run.app`        |
| `GCP_WEB_URL`       | `https://certchain-web-xxx.run.app`        |
| `PUBLIC_VERIFY_URL` | `https://certchain-web-xxx.run.app/verify` |
| `CORS_ORIGIN`       | `https://certchain-web-xxx.run.app`        |

### 5. Seed admin user (first time)

```bash
pnpm deploy:gcp:seed
```

Uses Cloud SQL Auth Proxy on port `15432` by default (avoids conflict with local Postgres on `5432`). Override with `PROXY_PORT=5433 pnpm deploy:gcp:seed` if needed.

Requires `infra/gcp/secrets.env` with `DB_PASSWORD`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (not the root `.env`).

### 6. URLs

After deploy, the script prints:

- Web frontend URL
- API URL
- Public verification URL pattern

### GCP architecture

| Component  | Service                     |
| ---------- | --------------------------- |
| Frontend   | Cloud Run (`certchain-web`) |
| API        | Cloud Run (`certchain-api`) |
| Database   | Cloud SQL PostgreSQL        |
| Secrets    | Secret Manager              |
| Images     | Artifact Registry           |
| Blockchain | Polygon Amoy (external)     |

## API Endpoints

| Method | Endpoint                 | Auth | Description         |
| ------ | ------------------------ | ---- | ------------------- |
| POST   | `/auth/login`            | No   | Admin login         |
| POST   | `/certificates`          | JWT  | Issue certificate   |
| GET    | `/verify/:certificateId` | No   | Public verification |

## Testing

```bash
pnpm test
```

Contract tests:

```bash
pnpm --filter @certchain/contracts test
```

API tests with coverage:

```bash
pnpm --filter @certchain/api test:cov
```

## Security

- Never commit `infra/gcp/secrets.env`, `.env`, or real credentials to Git
- Use placeholders in `.env.example` only
- Store production secrets in GCP Secret Manager
- If secrets were exposed, rotate them with `pnpm deploy:gcp:rotate-secrets`
- Only SHA-256 hashes are stored on blockchain
- PDFs and personal data are never written on-chain
- Duplicate certificate IDs and hashes are rejected
- Admin JWT required for certificate issuance

## License

MIT — see [LICENSE](LICENSE)
