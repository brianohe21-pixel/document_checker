import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IssueCertificateUseCase } from './issue-certificate.use-case';
import { CertificateRepositoryPort } from '../../domain/ports/certificate.repository.port';
import { BlockchainPort } from '../../domain/ports/blockchain.port';
import { PdfGeneratorPort } from '../../domain/ports/pdf-generator.port';
import { HashServicePort } from '../../domain/ports/hash.service.port';
import { Certificate } from '../../domain/entities/certificate.entity';

jest.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }));

describe('IssueCertificateUseCase', () => {
  const pdfBuffer = Buffer.from('pdf-content');

  const mockRepo: CertificateRepositoryPort = {
    findByCertificateId: jest.fn(),
    findByDocumentHash: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockResolvedValue(
        new Certificate(
          'id-1',
          'test-uuid-1234',
          'Juan Perez',
          'Blockchain Fundamentals',
          new Date('2026-06-01'),
          'hash123',
          '0xtx',
          new Date(),
        ),
      ),
  };

  const mockBlockchain: BlockchainPort = {
    registerCertificate: jest.fn().mockResolvedValue('0xtxhash'),
    verifyCertificate: jest.fn(),
  };

  const mockPdf: PdfGeneratorPort = {
    generate: jest.fn().mockResolvedValue(pdfBuffer),
  };

  const mockHash: HashServicePort = {
    sha256: jest.fn().mockReturnValue('hash123'),
  };

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000/verify'),
  } as unknown as ConfigService;

  const useCase = new IssueCertificateUseCase(
    mockRepo,
    mockBlockchain,
    mockPdf,
    mockHash,
    configService,
  );

  const dto = {
    studentName: 'Juan Perez',
    courseName: 'Blockchain Fundamentals',
    issueDate: '2026-06-01',
  };

  it('should issue certificate successfully', async () => {
    const result = await useCase.execute(dto);
    expect(result.certificateId).toBe('test-uuid-1234');
    expect(result.verificationUrl).toBe('http://localhost:3000/verify/test-uuid-1234');
    expect(result.transactionHash).toBe('0xtxhash');
    expect(result.documentHash).toBe('hash123');
    expect(result.pdfBase64).toBe(pdfBuffer.toString('base64'));
    expect(mockBlockchain.registerCertificate).toHaveBeenCalledWith('test-uuid-1234', 'hash123');
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should reject duplicate document hash', async () => {
    (mockRepo.findByDocumentHash as jest.Mock).mockResolvedValueOnce({} as Certificate);
    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
  });
});
