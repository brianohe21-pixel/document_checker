export interface SendCertificateEmailParams {
  to: string;
  studentName: string;
  courseName: string;
  verificationUrl: string;
  pdfBuffer: Buffer;
  certificateId: string;
}

export interface EmailPort {
  sendCertificateEmail(params: SendCertificateEmailParams): Promise<void>;
}

export const EMAIL_PORT = Symbol('EMAIL_PORT');
