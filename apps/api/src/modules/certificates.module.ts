import { Module } from '@nestjs/common';
import { IssueCertificateUseCase } from '../application/use-cases/issue-certificate.use-case';
import { ListCertificatesUseCase } from '../application/use-cases/list-certificates.use-case';
import { RevokeCertificateUseCase } from '../application/use-cases/revoke-certificate.use-case';
import { VerifyCertificateByPdfUseCase } from '../application/use-cases/verify-certificate-by-pdf.use-case';
import { VerifyCertificateUseCase } from '../application/use-cases/verify-certificate.use-case';
import { CERTIFICATE_REPOSITORY } from '../domain/ports/certificate.repository.port';
import { HASH_SERVICE } from '../domain/ports/hash.service.port';
import { PDF_GENERATOR_PORT } from '../domain/ports/pdf-generator.port';
import { Sha256HashService } from '../infrastructure/hash/sha256-hash.service';
import { PdfLibGeneratorService } from '../infrastructure/pdf/pdf-lib-generator.service';
import { PrismaCertificateRepository } from '../infrastructure/prisma/prisma-certificate.repository';
import { CertificatesController } from '../presentation/controllers/certificates.controller';
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
    { provide: CERTIFICATE_REPOSITORY, useClass: PrismaCertificateRepository },
    { provide: PDF_GENERATOR_PORT, useClass: PdfLibGeneratorService },
    { provide: HASH_SERVICE, useClass: Sha256HashService },
  ],
})
export class CertificatesModule {}
