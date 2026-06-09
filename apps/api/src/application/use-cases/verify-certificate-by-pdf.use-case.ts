import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VerifyCertificateResponse } from '@certchain/shared';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';
import { BLOCKCHAIN_PORT, BlockchainPort } from '../../domain/ports/blockchain.port';
import { HASH_SERVICE, HashServicePort } from '../../domain/ports/hash.service.port';
import { buildVerifyResponse, isPdfBuffer } from '../helpers/certificate-verification.helper';

@Injectable()
export class VerifyCertificateByPdfUseCase {
  private readonly logger = new Logger(VerifyCertificateByPdfUseCase.name);

  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepositoryPort,
    @Inject(BLOCKCHAIN_PORT)
    private readonly blockchain: BlockchainPort,
    @Inject(HASH_SERVICE)
    private readonly hashService: HashServicePort,
  ) {}

  async execute(file: Express.Multer.File): Promise<VerifyCertificateResponse> {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    if (!isPdfBuffer(file.buffer)) {
      throw new BadRequestException('Invalid PDF file');
    }

    const documentHash = this.hashService.sha256(file.buffer);
    const certificate = await this.certificateRepository.findByDocumentHash(documentHash);

    if (!certificate) {
      throw new NotFoundException('Certificate not found for this document');
    }

    let onChain = null;

    try {
      onChain = await this.blockchain.verifyCertificate(certificate.certificateId);
    } catch (error) {
      this.logger.warn(
        `On-chain verification failed for ${certificate.certificateId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    return buildVerifyResponse(certificate, onChain);
  }
}
