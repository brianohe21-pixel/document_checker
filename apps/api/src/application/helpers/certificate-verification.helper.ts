import { BLOCKCHAIN_NAME, CertificateStatus, VerifyCertificateResponse } from '@certchain/shared';
import { OnChainCertificate } from '@certchain/shared';
import { Certificate } from '../../domain/entities/certificate.entity';

export function buildVerifyResponse(
  certificate: Certificate,
  onChain: OnChainCertificate | null,
): VerifyCertificateResponse {
  const isRevoked = certificate.status === 'REVOKED' || onChain?.revoked === true;

  let valid = false;

  if (!isRevoked && onChain) {
    const normalizedOnChainHash = onChain.documentHash.startsWith('0x')
      ? onChain.documentHash.slice(2)
      : onChain.documentHash;

    valid =
      onChain.exists &&
      !onChain.revoked &&
      normalizedOnChainHash.toLowerCase() === certificate.documentHash.toLowerCase();
  }

  return {
    valid,
    status: isRevoked ? 'REVOKED' : (certificate.status as CertificateStatus),
    revokedAt: certificate.revokedAt?.toISOString(),
    revokedReason: certificate.revokedReason ?? undefined,
    studentName: certificate.studentName,
    courseName: certificate.courseName,
    issueDate: certificate.issueDate.toISOString().split('T')[0],
    documentHash: certificate.documentHash,
    blockchain: BLOCKCHAIN_NAME,
    transactionHash: certificate.transactionHash,
    certificateId: certificate.certificateId,
    organizationName: certificate.organizationName,
    organizationLogoUrl: certificate.organizationLogoUrl ?? undefined,
  };
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString() === '%PDF';
}
