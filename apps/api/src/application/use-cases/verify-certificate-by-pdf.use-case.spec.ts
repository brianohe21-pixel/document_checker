import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VerifyCertificateByPdfUseCase } from './verify-certificate-by-pdf.use-case';
import { Certificate } from '../../domain/entities/certificate.entity';
import { CertificateRepositoryPort } from '../../domain/ports/certificate.repository.port';
import { BlockchainPort } from '../../domain/ports/blockchain.port';
import { HashServicePort } from '../../domain/ports/hash.service.port';

describe('VerifyCertificateByPdfUseCase', () => {
  const pdfBuffer = Buffer.from('%PDF-1.4 test content');

  const certificate = new Certificate(
    'uuid-1',
    'cert-uuid',
    'Juan Perez',
    null,
    'Blockchain Fundamentals',
    new Date('2026-06-01'),
    'hash123',
    '0xtxhash',
    'ACTIVE',
    null,
    null,
    null,
    new Date(),
  );

  const mockRepo: CertificateRepositoryPort = {
    findByCertificateId: jest.fn(),
    findByDocumentHash: jest.fn().mockResolvedValue(certificate),
    create: jest.fn(),
    updateRevocation: jest.fn(),
    findAll: jest.fn(),
  };

  const mockBlockchain: BlockchainPort = {
    registerCertificate: jest.fn(),
    revokeCertificate: jest.fn(),
    verifyCertificate: jest.fn().mockResolvedValue({
      documentHash: '0xhash123',
      issuer: '0xIssuer',
      timestamp: 1700000000,
      exists: true,
      revoked: false,
    }),
  };

  const mockHash: HashServicePort = {
    sha256: jest.fn().mockReturnValue('hash123'),
  };

  const useCase = new VerifyCertificateByPdfUseCase(mockRepo, mockBlockchain, mockHash);

  const file = {
    buffer: pdfBuffer,
    mimetype: 'application/pdf',
  } as Express.Multer.File;

  it('should verify certificate by PDF hash', async () => {
    const result = await useCase.execute(file);
    expect(result.valid).toBe(true);
    expect(result.certificateId).toBe('cert-uuid');
    expect(mockHash.sha256).toHaveBeenCalledWith(pdfBuffer);
  });

  it('should reject missing file', async () => {
    await expect(useCase.execute(undefined as unknown as Express.Multer.File)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject non-PDF mime type', async () => {
    await expect(
      useCase.execute({ ...file, mimetype: 'text/plain' } as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid PDF magic bytes', async () => {
    await expect(
      useCase.execute({
        ...file,
        buffer: Buffer.from('not-a-pdf'),
      } as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when certificate not found for hash', async () => {
    (mockRepo.findByDocumentHash as jest.Mock).mockResolvedValueOnce(null);
    await expect(useCase.execute(file)).rejects.toThrow(NotFoundException);
  });
});
