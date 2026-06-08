import { Sha256HashService } from './sha256-hash.service';

describe('Sha256HashService', () => {
  const service = new Sha256HashService();

  it('should generate consistent SHA-256 hash', () => {
    const buffer = Buffer.from('test document content');
    const hash1 = service.sha256(buffer);
    const hash2 = service.sha256(buffer);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should generate different hashes for different content', () => {
    const hash1 = service.sha256(Buffer.from('content A'));
    const hash2 = service.sha256(Buffer.from('content B'));
    expect(hash1).not.toBe(hash2);
  });
});
