import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RevokeCertificateDto, RevokeCertificateResponse } from '@certchain/shared';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
} from '../../domain/ports/audit-log.repository.port';
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
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async execute(
    user: AuthenticatedUser,
    certificateId: string,
    dto: RevokeCertificateDto,
  ): Promise<RevokeCertificateResponse> {
    const certificate = await this.certificateRepository.findByCertificateIdAndOrganization(
      certificateId,
      user.organizationId,
    );

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (certificate.status === 'REVOKED') {
      throw new ConflictException('Certificate is already revoked');
    }

    const revokeTransactionHash = await this.blockchain.revokeCertificate(certificateId);

    const updated = await this.certificateRepository.updateRevocation({
      certificateId,
      organizationId: user.organizationId,
      revokedReason: dto.reason,
      revokeTransactionHash,
    });

    await this.auditLogRepository.create({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'REVOKE',
      entityType: 'certificate',
      entityId: certificateId,
      metadata: { reason: dto.reason },
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
