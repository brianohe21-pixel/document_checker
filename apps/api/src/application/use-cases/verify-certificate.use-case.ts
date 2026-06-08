import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BLOCKCHAIN_NAME, VerifyCertificateResponse } from '@certchain/shared';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';
import { BLOCKCHAIN_PORT, BlockchainPort } from '../../domain/ports/blockchain.port';

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

    let valid = false;

    try {
      const onChain = await this.blockchain.verifyCertificate(certificateId);
      const normalizedOnChainHash = onChain.documentHash.startsWith('0x')
        ? onChain.documentHash.slice(2)
        : onChain.documentHash;

      valid =
        onChain.exists &&
        normalizedOnChainHash.toLowerCase() === certificate.documentHash.toLowerCase();
    } catch (error) {
      this.logger.warn(
        `On-chain verification failed for ${certificateId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    return {
      valid,
      studentName: certificate.studentName,
      courseName: certificate.courseName,
      issueDate: certificate.issueDate.toISOString().split('T')[0],
      documentHash: certificate.documentHash,
      blockchain: BLOCKCHAIN_NAME,
      transactionHash: certificate.transactionHash,
    };
  }
}
