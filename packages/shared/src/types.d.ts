export interface IssueCertificateDto {
  studentName: string;
  courseName: string;
  issueDate: string;
}
export interface IssueCertificateResponse {
  certificateId: string;
  verificationUrl: string;
  transactionHash: string;
  documentHash: string;
}
export interface VerifyCertificateResponse {
  valid: boolean;
  studentName?: string;
  courseName?: string;
  issueDate?: string;
  documentHash?: string;
  blockchain: string;
  transactionHash?: string;
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
}
//# sourceMappingURL=types.d.ts.map
