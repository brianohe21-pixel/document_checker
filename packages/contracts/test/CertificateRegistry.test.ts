import { expect } from 'chai';
import { ethers } from 'hardhat';
import { CertificateRegistry } from '../typechain-types';

describe('CertificateRegistry', () => {
  let registry: CertificateRegistry;
  let issuer: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const certificateId = 'cert-001';
  const documentHash = ethers.keccak256(ethers.toUtf8Bytes('test-document'));

  beforeEach(async () => {
    [issuer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('CertificateRegistry');
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it('should register a certificate', async () => {
    await expect(registry.registerCertificate(certificateId, documentHash))
      .to.emit(registry, 'CertificateRegistered')
      .withArgs(certificateId, documentHash, issuer.address, (value: bigint) => value > 0n);

    const result = await registry.verifyCertificate(certificateId);
    expect(result.exists).to.equal(true);
    expect(result.documentHash).to.equal(documentHash);
    expect(result.issuer).to.equal(issuer.address);
    expect(result.timestamp).to.be.greaterThan(0);
  });

  it('should return non-existent certificate', async () => {
    const result = await registry.verifyCertificate('unknown');
    expect(result.exists).to.equal(false);
    expect(result.documentHash).to.equal(ethers.ZeroHash);
    expect(result.issuer).to.equal(ethers.ZeroAddress);
    expect(result.timestamp).to.equal(0);
  });

  it('should reject duplicate certificateId', async () => {
    await registry.registerCertificate(certificateId, documentHash);
    const otherHash = ethers.keccak256(ethers.toUtf8Bytes('other'));
    await expect(registry.registerCertificate(certificateId, otherHash)).to.be.revertedWith(
      'CertificateRegistry: certificateId already exists',
    );
  });

  it('should reject duplicate documentHash', async () => {
    await registry.registerCertificate(certificateId, documentHash);
    await expect(registry.registerCertificate('cert-002', documentHash)).to.be.revertedWith(
      'CertificateRegistry: documentHash already registered',
    );
  });

  it('should reject empty certificateId', async () => {
    await expect(registry.registerCertificate('', documentHash)).to.be.revertedWith(
      'CertificateRegistry: empty certificateId',
    );
  });

  it('should reject empty hash', async () => {
    await expect(registry.registerCertificate(certificateId, ethers.ZeroHash)).to.be.revertedWith(
      'CertificateRegistry: empty hash',
    );
  });
});
