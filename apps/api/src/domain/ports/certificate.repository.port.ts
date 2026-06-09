import { CertificateListResponse, CertificateStatus } from '@certchain/shared';
import { Certificate } from '../entities/certificate.entity';

export interface CreateCertificateData {
  certificateId: string;
  organizationId: string;
  templateId?: string;
  issuedByUserId?: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  issueDate: Date;
  documentHash: string;
  transactionHash: string;
}

export interface UpdateRevocationData {
  certificateId: string;
  organizationId: string;
  revokedReason: string;
  revokeTransactionHash: string;
}

export interface FindAllCertificatesParams {
  organizationId: string;
  page: number;
  limit: number;
  status?: CertificateStatus;
  search?: string;
  courseName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CertificateRepositoryPort {
  findByCertificateId(certificateId: string): Promise<Certificate | null>;
  findByCertificateIdAndOrganization(
    certificateId: string,
    organizationId: string,
  ): Promise<Certificate | null>;
  findByDocumentHash(documentHash: string): Promise<Certificate | null>;
  create(data: CreateCertificateData): Promise<Certificate>;
  updateRevocation(data: UpdateRevocationData): Promise<Certificate>;
  findAll(params: FindAllCertificatesParams): Promise<CertificateListResponse>;
}

export const CERTIFICATE_REPOSITORY = Symbol('CERTIFICATE_REPOSITORY');
