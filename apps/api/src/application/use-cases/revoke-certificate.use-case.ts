import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RevokeCertificateDto, RevokeCertificateResponse } from '@certchain/shared';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';
import { BLOCKCHAIN_PORT, BlockchainPort } from '../../domain/ports/blockchain.port';

@Injectable()
export class RevokeCertificateUseCase {
  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepositoryPort,
    @Inject(BLOCKCHAIN_PORT)
    private readonly blockchain: BlockchainPort,
  ) {}

  async execute(
    certificateId: string,
    dto: RevokeCertificateDto,
  ): Promise<RevokeCertificateResponse> {
    const certificate = await this.certificateRepository.findByCertificateId(certificateId);

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (certificate.status === 'REVOKED') {
      throw new ConflictException('Certificate is already revoked');
    }

    const revokeTransactionHash = await this.blockchain.revokeCertificate(certificateId);

    const updated = await this.certificateRepository.updateRevocation({
      certificateId,
      revokedReason: dto.reason,
      revokeTransactionHash,
    });

    return {
      certificateId: updated.certificateId,
      status: 'REVOKED',
      revokedAt: updated.revokedAt!.toISOString(),
      revokedReason: updated.revokedReason!,
      revokeTransactionHash: updated.revokeTransactionHash!,
    };
  }
}
