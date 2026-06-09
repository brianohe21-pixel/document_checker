import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailPort, SendCertificateEmailParams } from '../../domain/ports/email.port';

@Injectable()
export class ResendEmailAdapter implements EmailPort {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Resend {
    if (this.resend) return this.resend;

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.resend = new Resend(apiKey);
    return this.resend;
  }

  async sendCertificateEmail(params: SendCertificateEmailParams): Promise<void> {
    const from = this.configService.get<string>('EMAIL_FROM', 'CertChain <onboarding@resend.dev>');
    const client = this.getClient();

    const { error } = await client.emails.send({
      from,
      to: params.to,
      subject: `Your certificate: ${params.courseName}`,
      html: `
        <h1>Congratulations, ${params.studentName}!</h1>
        <p>You have been issued a certificate for <strong>${params.courseName}</strong>.</p>
        <p>Verify your certificate at: <a href="${params.verificationUrl}">${params.verificationUrl}</a></p>
        <p>Your certificate PDF is attached to this email.</p>
      `,
      attachments: [
        {
          filename: `certificate-${params.certificateId}.pdf`,
          content: params.pdfBuffer,
        },
      ],
    });

    if (error) {
      this.logger.error(`Failed to send email to ${params.to}: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Certificate email sent to ${params.to}`);
  }
}
