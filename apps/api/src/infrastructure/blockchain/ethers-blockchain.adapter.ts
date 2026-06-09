import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { CertificateRegistryABI, OnChainCertificate } from '@certchain/shared';
import { BlockchainPort } from '../../domain/ports/blockchain.port';

@Injectable()
export class EthersBlockchainAdapter implements BlockchainPort {
  private readonly logger = new Logger(EthersBlockchainAdapter.name);
  private provider: JsonRpcProvider | null = null;
  private wallet: Wallet | null = null;
  private contract: Contract | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getContract(): Contract {
    if (this.contract) return this.contract;

    const rpcUrl = this.configService.get<string>('RPC_URL');
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error('Blockchain configuration missing: RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS');
    }

    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.contract = new Contract(contractAddress, CertificateRegistryABI, this.wallet);
    return this.contract;
  }

  async registerCertificate(certificateId: string, documentHash: string): Promise<string> {
    const contract = this.getContract();
    const hashBytes32 = documentHash.startsWith('0x') ? documentHash : `0x${documentHash}`;

    const code = await this.provider!.getCode(await contract.getAddress());
    if (code === '0x') {
      throw new Error(
        'No contract deployed at CONTRACT_ADDRESS. Run pnpm setup:local-blockchain or restart pnpm dev.',
      );
    }

    const tx = await contract.registerCertificate(certificateId, hashBytes32);
    const receipt = await tx.wait();
    if (receipt.status !== 1) {
      throw new Error('Blockchain registration transaction failed');
    }
    this.logger.log(`Certificate ${certificateId} registered. Tx: ${receipt.hash}`);
    return receipt.hash as string;
  }

  async revokeCertificate(certificateId: string): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.revokeCertificate(certificateId);
    const receipt = await tx.wait();
    if (receipt.status !== 1) {
      throw new Error('Blockchain revocation transaction failed');
    }
    this.logger.log(`Certificate ${certificateId} revoked. Tx: ${receipt.hash}`);
    return receipt.hash as string;
  }

  async verifyCertificate(certificateId: string): Promise<OnChainCertificate> {
    const contract = this.getContract();
    const result = await contract.verifyCertificate(certificateId);
    return {
      documentHash: result.documentHash as string,
      issuer: result.issuer as string,
      timestamp: Number(result.timestamp),
      exists: result.exists as boolean,
      revoked: result.revoked as boolean,
    };
  }
}
