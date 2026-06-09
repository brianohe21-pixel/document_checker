import { Module } from '@nestjs/common';
import { IssueCertificateUseCase } from '../application/use-cases/issue-certificate.use-case';
import { ListCertificatesUseCase } from '../application/use-cases/list-certificates.use-case';
import { RevokeCertificateUseCase } from '../application/use-cases/revoke-certificate.use-case';
import { VerifyCertificateByPdfUseCase } from '../application/use-cases/verify-certificate-by-pdf.use-case';
import { VerifyCertificateUseCase } from '../application/use-cases/verify-certificate.use-case';
import { AUDIT_LOG_REPOSITORY } from '../domain/ports/audit-log.repository.port';
import { CERTIFICATE_REPOSITORY } from '../domain/ports/certificate.repository.port';
import { HASH_SERVICE } from '../domain/ports/hash.service.port';
import { ORGANIZATION_REPOSITORY } from '../domain/ports/organization.repository.port';
import { PDF_GENERATOR_PORT } from '../domain/ports/pdf-generator.port';
import { TEMPLATE_REPOSITORY } from '../domain/ports/template.repository.port';
import { Sha256HashService } from '../infrastructure/hash/sha256-hash.service';
import { PdfLibGeneratorService } from '../infrastructure/pdf/pdf-lib-generator.service';
import { PrismaAuditLogRepository } from '../infrastructure/prisma/prisma-audit-log.repository';
import { PrismaCertificateRepository } from '../infrastructure/prisma/prisma-certificate.repository';
import { PrismaOrganizationRepository } from '../infrastructure/prisma/prisma-organization.repository';
import { PrismaTemplateRepository } from '../infrastructure/prisma/prisma-template.repository';
import { CertificatesController } from '../presentation/controllers/certificates.controller';
import { RolesGuard } from '../presentation/guards/roles.guard';
import { BlockchainModule } from './blockchain.module';
import { EmailModule } from './email.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, BlockchainModule, EmailModule],
  controllers: [CertificatesController],
  providers: [
    IssueCertificateUseCase,
    VerifyCertificateUseCase,
    VerifyCertificateByPdfUseCase,
    RevokeCertificateUseCase,
    ListCertificatesUseCase,
    RolesGuard,
    { provide: CERTIFICATE_REPOSITORY, useClass: PrismaCertificateRepository },
    { provide: PDF_GENERATOR_PORT, useClass: PdfLibGeneratorService },
    { provide: HASH_SERVICE, useClass: Sha256HashService },
    { provide: TEMPLATE_REPOSITORY, useClass: PrismaTemplateRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  ],
  exports: [IssueCertificateUseCase, CERTIFICATE_REPOSITORY],
})
export class CertificatesModule {}
