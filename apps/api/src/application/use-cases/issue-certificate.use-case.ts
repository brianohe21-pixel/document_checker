import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IssueCertificateDto, IssueCertificateResponse } from '@certchain/shared';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
} from '../../domain/ports/audit-log.repository.port';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';
import { BLOCKCHAIN_PORT, BlockchainPort } from '../../domain/ports/blockchain.port';
import { PDF_GENERATOR_PORT, PdfGeneratorPort } from '../../domain/ports/pdf-generator.port';
import { HASH_SERVICE, HashServicePort } from '../../domain/ports/hash.service.port';
import { EMAIL_PORT, EmailPort } from '../../domain/ports/email.port';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepositoryPort,
} from '../../domain/ports/organization.repository.port';
import {
  TEMPLATE_REPOSITORY,
  TemplateRepositoryPort,
} from '../../domain/ports/template.repository.port';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface IssueCertificateContext {
  user?: AuthenticatedUser;
  organizationId: string;
  issuedByUserId?: string;
  skipEmail?: boolean;
}

@Injectable()
export class IssueCertificateUseCase {
  private readonly logger = new Logger(IssueCertificateUseCase.name);

  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepositoryPort,
    @Inject(BLOCKCHAIN_PORT)
    private readonly blockchain: BlockchainPort,
    @Inject(PDF_GENERATOR_PORT)
    private readonly pdfGenerator: PdfGeneratorPort,
    @Inject(HASH_SERVICE)
    private readonly hashService: HashServicePort,
    @Inject(EMAIL_PORT)
    private readonly emailPort: EmailPort,
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    dto: IssueCertificateDto,
    context: IssueCertificateContext,
  ): Promise<IssueCertificateResponse & { pdfBase64: string }> {
    const organization = await this.organizationRepository.findById(context.organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    let template = null;
    if (dto.templateId) {
      template = await this.templateRepository.findByIdAndOrganization(
        dto.templateId,
        context.organizationId,
      );
      if (!template) throw new NotFoundException('Template not found');
    } else {
      template = await this.templateRepository.findDefault(context.organizationId);
    }

    const certificateId = uuidv4();
    const defaultVerifyUrl = this.configService.get<string>(
      'PUBLIC_VERIFY_URL',
      'http://localhost:3000/verify',
    );
    const baseUrl = organization.verifyBaseUrl ?? defaultVerifyUrl;
    const verificationUrl = `${baseUrl.replace(/\/$/, '')}/${certificateId}`;

    const pdfBuffer = await this.pdfGenerator.generate({
      certificateId,
      studentName: dto.studentName,
      courseName: dto.courseName,
      issueDate: dto.issueDate,
      verificationUrl,
      template: template?.config,
    });

    const documentHash = this.hashService.sha256(pdfBuffer);

    const existingByHash = await this.certificateRepository.findByDocumentHash(documentHash);
    if (existingByHash) {
      throw new ConflictException('Document hash already registered');
    }

    const transactionHash = await this.blockchain.registerCertificate(certificateId, documentHash);

    await this.certificateRepository.create({
      certificateId,
      organizationId: context.organizationId,
      templateId: template?.id,
      issuedByUserId: context.issuedByUserId,
      studentName: dto.studentName,
      studentEmail: dto.studentEmail,
      courseName: dto.courseName,
      issueDate: new Date(dto.issueDate),
      documentHash,
      transactionHash,
    });

    if (context.issuedByUserId) {
      await this.auditLogRepository.create({
        organizationId: context.organizationId,
        userId: context.issuedByUserId,
        action: 'ISSUE',
        entityType: 'certificate',
        entityId: certificateId,
        metadata: { studentName: dto.studentName, courseName: dto.courseName },
      });
    }

    if (dto.studentEmail && !context.skipEmail) {
      this.sendEmailAsync(
        dto.studentEmail,
        dto.studentName,
        dto.courseName,
        verificationUrl,
        pdfBuffer,
        certificateId,
      );
    }

    return {
      certificateId,
      verificationUrl,
      transactionHash,
      documentHash,
      pdfBase64: pdfBuffer.toString('base64'),
    };
  }

  private sendEmailAsync(
    to: string,
    studentName: string,
    courseName: string,
    verificationUrl: string,
    pdfBuffer: Buffer,
    certificateId: string,
  ): void {
    this.emailPort
      .sendCertificateEmail({
        to,
        studentName,
        courseName,
        verificationUrl,
        pdfBuffer,
        certificateId,
      })
      .catch((error) => {
        this.logger.warn(
          `Email delivery failed for certificate ${certificateId}: ${error instanceof Error ? error.message : error}`,
        );
      });
  }
}
