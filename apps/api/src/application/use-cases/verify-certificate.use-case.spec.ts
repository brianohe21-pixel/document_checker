import { NotFoundException } from '@nestjs/common';
import { VerifyCertificateUseCase } from './verify-certificate.use-case';
import { Certificate } from '../../domain/entities/certificate.entity';
import { CertificateRepositoryPort } from '../../domain/ports/certificate.repository.port';
import { BlockchainPort } from '../../domain/ports/blockchain.port';

describe('VerifyCertificateUseCase', () => {
  const certificate = new Certificate(
    'uuid-1',
    'cert-uuid',
    'Juan Perez',
    'Blockchain Fundamentals',
    new Date('2026-06-01'),
    'abc123hash',
    '0xtxhash',
    new Date(),
  );

  const mockRepo: CertificateRepositoryPort = {
    findByCertificateId: jest.fn().mockResolvedValue(certificate),
    findByDocumentHash: jest.fn(),
    create: jest.fn(),
  };

  const mockBlockchain: BlockchainPort = {
    registerCertificate: jest.fn(),
    verifyCertificate: jest.fn().mockResolvedValue({
      documentHash: '0xabc123hash',
      issuer: '0xIssuer',
      timestamp: 1700000000,
      exists: true,
    }),
  };

  const useCase = new VerifyCertificateUseCase(mockRepo, mockBlockchain);

  it('should return valid when on-chain hash matches', async () => {
    const result = await useCase.execute('cert-uuid');
    expect(result.valid).toBe(true);
    expect(result.studentName).toBe('Juan Perez');
    expect(result.blockchain).toBe('Polygon Amoy');
  });

  it('should return invalid when hash mismatch', async () => {
    (mockBlockchain.verifyCertificate as jest.Mock).mockResolvedValueOnce({
      documentHash: '0xdifferent',
      issuer: '0xIssuer',
      timestamp: 1700000000,
      exists: true,
    });
    const result = await useCase.execute('cert-uuid');
    expect(result.valid).toBe(false);
  });

  it('should throw when certificate not found', async () => {
    (mockRepo.findByCertificateId as jest.Mock).mockResolvedValueOnce(null);
    await expect(useCase.execute('unknown')).rejects.toThrow(NotFoundException);
  });

  it('should return invalid when blockchain verification fails', async () => {
    (mockBlockchain.verifyCertificate as jest.Mock).mockRejectedValueOnce(
      new Error('could not decode result data'),
    );
    const result = await useCase.execute('cert-uuid');
    expect(result.valid).toBe(false);
    expect(result.studentName).toBe('Juan Perez');
  });

  it('should match hash without 0x prefix on chain', async () => {
    (mockBlockchain.verifyCertificate as jest.Mock).mockResolvedValueOnce({
      documentHash: 'abc123hash',
      issuer: '0xIssuer',
      timestamp: 1700000000,
      exists: true,
    });
    const result = await useCase.execute('cert-uuid');
    expect(result.valid).toBe(true);
  });

  it('should return invalid when certificate does not exist on chain', async () => {
    (mockBlockchain.verifyCertificate as jest.Mock).mockResolvedValueOnce({
      documentHash: '0xabc123hash',
      issuer: '0xIssuer',
      timestamp: 1700000000,
      exists: false,
    });
    const result = await useCase.execute('cert-uuid');
    expect(result.valid).toBe(false);
  });

  it('should handle non-Error blockchain failures', async () => {
    (mockBlockchain.verifyCertificate as jest.Mock).mockRejectedValueOnce('rpc unavailable');
    const result = await useCase.execute('cert-uuid');
    expect(result.valid).toBe(false);
  });
});
