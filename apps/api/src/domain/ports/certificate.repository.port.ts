import { CertificateListResponse, CertificateStatus } from '@certchain/shared';
import { Certificate } from '../entities/certificate.entity';

export interface CreateCertificateData {
  certificateId: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  issueDate: Date;
  documentHash: string;
  transactionHash: string;
}

export interface UpdateRevocationData {
  certificateId: string;
  revokedReason: string;
  revokeTransactionHash: string;
}

export interface FindAllCertificatesParams {
  page: number;
  limit: number;
  status?: CertificateStatus;
}

export interface CertificateRepositoryPort {
  findByCertificateId(certificateId: string): Promise<Certificate | null>;
  findByDocumentHash(documentHash: string): Promise<Certificate | null>;
  create(data: CreateCertificateData): Promise<Certificate>;
  updateRevocation(data: UpdateRevocationData): Promise<Certificate>;
  findAll(params: FindAllCertificatesParams): Promise<CertificateListResponse>;
}

export const CERTIFICATE_REPOSITORY = Symbol('CERTIFICATE_REPOSITORY');
