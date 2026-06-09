import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VerifyCertificateResponse } from '@certchain/shared';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';
import { BLOCKCHAIN_PORT, BlockchainPort } from '../../domain/ports/blockchain.port';
import { buildVerifyResponse } from '../helpers/certificate-verification.helper';

@Injectable()
export class VerifyCertificateUseCase {
  private readonly logger = new Logger(VerifyCertificateUseCase.name);

  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepositoryPort,
    @Inject(BLOCKCHAIN_PORT)
    private readonly blockchain: BlockchainPort,
  ) {}

  async execute(certificateId: string): Promise<VerifyCertificateResponse> {
    const certificate = await this.certificateRepository.findByCertificateId(certificateId);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    let onChain = null;

    try {
      onChain = await this.blockchain.verifyCertificate(certificateId);
    } catch (error) {
      this.logger.warn(
        `On-chain verification failed for ${certificateId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    return buildVerifyResponse(certificate, onChain);
  }
}
