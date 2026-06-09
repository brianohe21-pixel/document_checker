# @certchain/shared

Shared TypeScript types, constants, and the `CertificateRegistry` ABI for [CertChain Open](https://github.com/brianohe21-pixel/document_checker).

## Install

```bash
npm install @certchain/shared
```

## Usage

```typescript
import {
  VerifyCertificateResponse,
  IssueCertificateDto,
  CertificateRegistryABI,
  BLOCKCHAIN_NAME,
} from '@certchain/shared';
```

## Exports

- **Types** — DTOs and API response shapes (`IssueCertificateDto`, `VerifyCertificateResponse`, etc.)
- **ABI** — `CertificateRegistryABI` for ethers/viem integrations
- **Constants** — `BLOCKCHAIN_NAME`, `POLYGONSCAN_AMOY_URL`

## Versioning

This package follows [semver](https://semver.org/). See the [monorepo CHANGELOG](https://github.com/brianohe21-pixel/document_checker/blob/main/packages/shared/CHANGELOG.md).

## License

MIT
