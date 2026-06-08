import { ConfigService } from '@nestjs/config';
import { EthersBlockchainAdapter } from './ethers-blockchain.adapter';

const mockWait = jest.fn().mockResolvedValue({ hash: '0xabc123' });
const mockRegisterCertificate = jest.fn().mockResolvedValue({ wait: mockWait });
const mockVerifyCertificate = jest.fn().mockResolvedValue({
  documentHash: '0xdeadbeef',
  issuer: '0xIssuer',
  timestamp: 1700000000n,
  exists: true,
});

jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn(),
  Wallet: jest.fn().mockImplementation(() => ({})),
  Contract: jest.fn().mockImplementation(() => ({
    registerCertificate: mockRegisterCertificate,
    verifyCertificate: mockVerifyCertificate,
  })),
}));

describe('EthersBlockchainAdapter', () => {
  const createAdapter = () => {
    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          RPC_URL: 'http://localhost:8545',
          PRIVATE_KEY: '0x' + '1'.repeat(64),
          CONTRACT_ADDRESS: '0xContract',
        };
        return config[key];
      }),
    } as unknown as ConfigService;
    return new EthersBlockchainAdapter(configService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWait.mockResolvedValue({ hash: '0xabc123' });
  });

  it('should register certificate and return transaction hash', async () => {
    const adapter = createAdapter();
    const txHash = await adapter.registerCertificate('cert-1', 'a'.repeat(64));
    expect(txHash).toBe('0xabc123');
    expect(mockRegisterCertificate).toHaveBeenCalled();
  });

  it('should verify certificate on chain', async () => {
    const adapter = createAdapter();
    const result = await adapter.verifyCertificate('cert-1');
    expect(result.exists).toBe(true);
    expect(result.documentHash).toBe('0xdeadbeef');
    expect(result.timestamp).toBe(1700000000);
  });

  it('should prefix hash with 0x when registering', async () => {
    const adapter = createAdapter();
    await adapter.registerCertificate('cert-2', 'b'.repeat(64));
    expect(mockRegisterCertificate).toHaveBeenCalledWith('cert-2', '0x' + 'b'.repeat(64));
  });

  it('should not prefix hash when already has 0x', async () => {
    const adapter = createAdapter();
    const hash = '0x' + 'c'.repeat(64);
    await adapter.registerCertificate('cert-3', hash);
    expect(mockRegisterCertificate).toHaveBeenCalledWith('cert-3', hash);
  });

  it('should throw when blockchain config is missing', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const adapter = new EthersBlockchainAdapter(configService);
    await expect(adapter.registerCertificate('cert-1', 'hash')).rejects.toThrow(
      'Blockchain configuration missing',
    );
  });
});
