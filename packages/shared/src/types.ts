export type CertificateStatus = 'ACTIVE' | 'REVOKED';

export interface IssueCertificateDto {
  studentName: string;
  courseName: string;
  issueDate: string;
  studentEmail?: string;
}

export interface IssueCertificateResponse {
  certificateId: string;
  verificationUrl: string;
  transactionHash: string;
  documentHash: string;
}

export interface VerifyCertificateResponse {
  valid: boolean;
  status?: CertificateStatus;
  revokedAt?: string;
  revokedReason?: string;
  studentName?: string;
  courseName?: string;
  issueDate?: string;
  documentHash?: string;
  blockchain: string;
  transactionHash?: string;
  certificateId?: string;
}

export interface CertificateListItem {
  certificateId: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  issueDate: string;
  status: CertificateStatus;
  createdAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface CertificateListResponse {
  items: CertificateListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface RevokeCertificateDto {
  reason: string;
}

export interface RevokeCertificateResponse {
  certificateId: string;
  status: CertificateStatus;
  revokedAt: string;
  revokedReason: string;
  revokeTransactionHash: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface OnChainCertificate {
  documentHash: string;
  issuer: string;
  timestamp: number;
  exists: boolean;
  revoked: boolean;
}
