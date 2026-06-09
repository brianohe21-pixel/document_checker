import { TemplateConfig } from '@certchain/shared';

export interface CertificatePdfData {
  certificateId: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  verificationUrl: string;
  template?: TemplateConfig;
}

export interface PdfGeneratorPort {
  generate(data: CertificatePdfData): Promise<Buffer>;
}

export const PDF_GENERATOR_PORT = Symbol('PDF_GENERATOR_PORT');
