import { ConflictException, NotFoundException } from '@nestjs/common';
import { RevokeCertificateUseCase } from './revoke-certificate.use-case';
import { Certificate } from '../../domain/entities/certificate.entity';
import { CertificateRepositoryPort } from '../../domain/ports/certificate.repository.port';
import { BlockchainPort } from '../../domain/ports/blockchain.port';

describe('RevokeCertificateUseCase', () => {
  const activeCertificate = new Certificate(
    'uuid-1',
    'cert-uuid',
    'Juan Perez',
    null,
    'Blockchain Fundamentals',
    new Date('2026-06-01'),
    'abc123hash',
    '0xtxhash',
    'ACTIVE',
    null,
    null,
    null,
    new Date(),
  );

  const revokedCertificate = new Certificate(
    'uuid-1',
    'cert-uuid',
    'Juan Perez',
    null,
    'Blockchain Fundamentals',
    new Date('2026-06-01'),
    'abc123hash',
    '0xtxhash',
    'REVOKED',
    new Date('2026-06-02'),
    'Issued in error',
    '0xrevoketx',
    new Date(),
  );

  const mockRepo: CertificateRepositoryPort = {
    findByCertificateId: jest.fn().mockResolvedValue(activeCertificate),
    findByDocumentHash: jest.fn(),
    create: jest.fn(),
    updateRevocation: jest.fn().mockResolvedValue(revokedCertificate),
    findAll: jest.fn(),
  };

  const mockBlockchain: BlockchainPort = {
    registerCertificate: jest.fn(),
    revokeCertificate: jest.fn().mockResolvedValue('0xrevoketx'),
    verifyCertificate: jest.fn(),
  };

  const useCase = new RevokeCertificateUseCase(mockRepo, mockBlockchain);

  it('should revoke certificate successfully', async () => {
    const result = await useCase.execute('cert-uuid', { reason: 'Issued in error' });
    expect(result.status).toBe('REVOKED');
    expect(result.revokeTransactionHash).toBe('0xrevoketx');
    expect(mockBlockchain.revokeCertificate).toHaveBeenCalledWith('cert-uuid');
    expect(mockRepo.updateRevocation).toHaveBeenCalled();
  });

  it('should throw when certificate not found', async () => {
    (mockRepo.findByCertificateId as jest.Mock).mockResolvedValueOnce(null);
    await expect(useCase.execute('unknown', { reason: 'test' })).rejects.toThrow(NotFoundException);
  });

  it('should throw when already revoked', async () => {
    (mockRepo.findByCertificateId as jest.Mock).mockResolvedValueOnce(revokedCertificate);
    await expect(useCase.execute('cert-uuid', { reason: 'test' })).rejects.toThrow(
      ConflictException,
    );
  });
});
