import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IssueCertificateDto, IssueCertificateResponse } from '@certchain/shared';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';
import { BLOCKCHAIN_PORT, BlockchainPort } from '../../domain/ports/blockchain.port';
import { PDF_GENERATOR_PORT, PdfGeneratorPort } from '../../domain/ports/pdf-generator.port';
import { HASH_SERVICE, HashServicePort } from '../../domain/ports/hash.service.port';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IssueCertificateUseCase {
  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepositoryPort,
    @Inject(BLOCKCHAIN_PORT)
    private readonly blockchain: BlockchainPort,
    @Inject(PDF_GENERATOR_PORT)
    private readonly pdfGenerator: PdfGeneratorPort,
    @Inject(HASH_SERVICE)
    private readonly hashService: HashServicePort,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    dto: IssueCertificateDto,
  ): Promise<IssueCertificateResponse & { pdfBase64: string }> {
    const certificateId = uuidv4();
    const publicVerifyUrl = this.configService.get<string>(
      'PUBLIC_VERIFY_URL',
      'http://localhost:3000/verify',
    );
    const verificationUrl = `${publicVerifyUrl}/${certificateId}`;

    const pdfBuffer = await this.pdfGenerator.generate({
      certificateId,
      studentName: dto.studentName,
      courseName: dto.courseName,
      issueDate: dto.issueDate,
      verificationUrl,
    });

    const documentHash = this.hashService.sha256(pdfBuffer);

    const existingByHash = await this.certificateRepository.findByDocumentHash(documentHash);
    if (existingByHash) {
      throw new ConflictException('Document hash already registered');
    }

    const transactionHash = await this.blockchain.registerCertificate(certificateId, documentHash);

    await this.certificateRepository.create({
      certificateId,
      studentName: dto.studentName,
      courseName: dto.courseName,
      issueDate: new Date(dto.issueDate),
      documentHash,
      transactionHash,
    });

    return {
      certificateId,
      verificationUrl,
      transactionHash,
      documentHash,
      pdfBase64: pdfBuffer.toString('base64'),
    };
  }
}
