import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IssueCertificateUseCase } from './issue-certificate.use-case';
import { CertificateRepositoryPort } from '../../domain/ports/certificate.repository.port';
import { BlockchainPort } from '../../domain/ports/blockchain.port';
import { PdfGeneratorPort } from '../../domain/ports/pdf-generator.port';
import { HashServicePort } from '../../domain/ports/hash.service.port';
import { EmailPort } from '../../domain/ports/email.port';
import { OrganizationRepositoryPort } from '../../domain/ports/organization.repository.port';
import { TemplateRepositoryPort } from '../../domain/ports/template.repository.port';
import { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import { Certificate } from '../../domain/entities/certificate.entity';

jest.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }));

const ORG_ID = '00000000-0000-0000-0000-000000000001';

function createCertificate(): Certificate {
  return new Certificate(
    'id-1',
    'test-uuid-1234',
    ORG_ID,
    'Juan Perez',
    null,
    'Blockchain Fundamentals',
    new Date('2026-06-01'),
    'hash123',
    '0xtx',
    'ACTIVE',
    null,
    null,
    null,
    new Date(),
  );
}

describe('IssueCertificateUseCase', () => {
  const pdfBuffer = Buffer.from('pdf-content');

  const mockRepo: CertificateRepositoryPort = {
    findByCertificateId: jest.fn(),
    findByCertificateIdAndOrganization: jest.fn(),
    findByDocumentHash: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(createCertificate()),
    updateRevocation: jest.fn(),
    findAll: jest.fn(),
  };

  const mockBlockchain: BlockchainPort = {
    registerCertificate: jest.fn().mockResolvedValue('0xtxhash'),
    revokeCertificate: jest.fn(),
    verifyCertificate: jest.fn(),
  };

  const mockPdf: PdfGeneratorPort = {
    generate: jest.fn().mockResolvedValue(pdfBuffer),
  };

  const mockHash: HashServicePort = {
    sha256: jest.fn().mockReturnValue('hash123'),
  };

  const mockEmail: EmailPort = {
    sendCertificateEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockOrg: OrganizationRepositoryPort = {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue({
      id: ORG_ID,
      name: 'Default',
      slug: 'default',
      logoUrl: null,
      primaryColor: null,
      verifyBaseUrl: null,
      isActive: true,
      createdAt: new Date(),
    }),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    toDto: jest.fn(),
  };

  const mockTemplate: TemplateRepositoryPort = {
    findByOrganization: jest.fn(),
    findById: jest.fn(),
    findByIdAndOrganization: jest.fn(),
    findDefault: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    toDto: jest.fn(),
  };

  const mockAudit: AuditLogRepositoryPort = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000/verify'),
  } as unknown as ConfigService;

  const useCase = new IssueCertificateUseCase(
    mockRepo,
    mockBlockchain,
    mockPdf,
    mockHash,
    mockEmail,
    mockTemplate,
    mockOrg,
    mockAudit,
    configService,
  );

  const dto = {
    studentName: 'Juan Perez',
    courseName: 'Blockchain Fundamentals',
    issueDate: '2026-06-01',
  };

  const context = {
    organizationId: ORG_ID,
    issuedByUserId: 'user-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRepo.findByDocumentHash as jest.Mock).mockResolvedValue(null);
  });

  it('should issue certificate successfully', async () => {
    const result = await useCase.execute(dto, context);
    expect(result.certificateId).toBe('test-uuid-1234');
    expect(result.verificationUrl).toBe('http://localhost:3000/verify/test-uuid-1234');
    expect(result.transactionHash).toBe('0xtxhash');
    expect(result.documentHash).toBe('hash123');
    expect(result.pdfBase64).toBe(pdfBuffer.toString('base64'));
    expect(mockBlockchain.registerCertificate).toHaveBeenCalledWith('test-uuid-1234', 'hash123');
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockEmail.sendCertificateEmail).not.toHaveBeenCalled();
  });

  it('should send email when studentEmail is provided', async () => {
    await useCase.execute({ ...dto, studentEmail: 'student@example.com' }, context);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockEmail.sendCertificateEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'student@example.com',
        studentName: 'Juan Perez',
        courseName: 'Blockchain Fundamentals',
      }),
    );
  });

  it('should not fail issuance when email delivery fails', async () => {
    (mockEmail.sendCertificateEmail as jest.Mock).mockRejectedValueOnce(new Error('email failed'));
    const result = await useCase.execute({ ...dto, studentEmail: 'student@example.com' }, context);
    expect(result.certificateId).toBe('test-uuid-1234');
  });

  it('should reject duplicate document hash', async () => {
    (mockRepo.findByDocumentHash as jest.Mock).mockResolvedValueOnce(createCertificate());
    await expect(useCase.execute(dto, context)).rejects.toThrow(ConflictException);
  });
});
