export type CertificateStatus = 'ACTIVE' | 'REVOKED';

export type MembershipRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ISSUER' | 'VIEWER';

export type BulkJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type BulkJobItemStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';

export interface TemplateConfig {
  title: string;
  subtitle?: string;
  bodyLines?: string[];
  primaryColor: string;
  showQr: boolean;
  showCertificateId: boolean;
  customFields?: { key: string; label: string; value?: string }[];
  logoUrl?: string;
  signatureImageUrl?: string;
}

export interface IssueCertificateDto {
  studentName: string;
  courseName: string;
  issueDate: string;
  studentEmail?: string;
  templateId?: string;
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
  organizationName?: string;
  organizationLogoUrl?: string;
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
  issuedByEmail?: string;
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
  organizationId?: string;
  organizationSlug?: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  role: MembershipRole;
}

export interface LoginResponse {
  accessToken?: string;
  requiresOrganizationSelection?: boolean;
  organizations?: OrganizationSummary[];
}

export interface AuthMeResponse {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: MembershipRole;
  memberships: OrganizationSummary[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  verifyBaseUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  verifyBaseUrl?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  verifyBaseUrl?: string;
  isActive?: boolean;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  email: string;
  createdAt: string;
}

export interface InviteMemberDto {
  email: string;
  password: string;
  role: MembershipRole;
}

export interface UpdateMemberRoleDto {
  role: MembershipRole;
}

export interface CertificateTemplate {
  id: string;
  organizationId: string;
  name: string;
  config: TemplateConfig;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  config: TemplateConfig;
  isDefault?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  config?: TemplateConfig;
  isDefault?: boolean;
}

export interface PreviewTemplateDto {
  studentName?: string;
  courseName?: string;
  issueDate?: string;
}

export interface PreviewTemplateResponse {
  pdfBase64: string;
}

export interface BulkJob {
  id: string;
  organizationId: string;
  status: BulkJobStatus;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  fileName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BulkJobItem {
  id: string;
  rowNumber: number;
  status: BulkJobItemStatus;
  certificateId?: string;
  error?: string;
  payload: IssueCertificateDto;
}

export interface BulkJobDetail extends BulkJob {
  items: BulkJobItem[];
}

export interface OnChainCertificate {
  documentHash: string;
  issuer: string;
  timestamp: number;
  exists: boolean;
  revoked: boolean;
}
