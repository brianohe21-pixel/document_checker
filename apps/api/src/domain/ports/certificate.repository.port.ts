import { Certificate } from '../entities/certificate.entity';

export interface CreateCertificateData {
  certificateId: string;
  studentName: string;
  courseName: string;
  issueDate: Date;
  documentHash: string;
  transactionHash: string;
}

export interface CertificateRepositoryPort {
  findByCertificateId(certificateId: string): Promise<Certificate | null>;
  findByDocumentHash(documentHash: string): Promise<Certificate | null>;
  create(data: CreateCertificateData): Promise<Certificate>;
}

export const CERTIFICATE_REPOSITORY = Symbol('CERTIFICATE_REPOSITORY');
