import { CertificateStatus } from '@certchain/shared';

export class Certificate {
  constructor(
    public readonly id: string,
    public readonly certificateId: string,
    public readonly studentName: string,
    public readonly studentEmail: string | null,
    public readonly courseName: string,
    public readonly issueDate: Date,
    public readonly documentHash: string,
    public readonly transactionHash: string,
    public readonly status: CertificateStatus,
    public readonly revokedAt: Date | null,
    public readonly revokedReason: string | null,
    public readonly revokeTransactionHash: string | null,
    public readonly createdAt: Date,
  ) {}
}
