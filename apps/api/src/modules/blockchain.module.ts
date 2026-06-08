import { Module } from '@nestjs/common';
import { BLOCKCHAIN_PORT } from '../domain/ports/blockchain.port';
import { EthersBlockchainAdapter } from '../infrastructure/blockchain/ethers-blockchain.adapter';

@Module({
  providers: [{ provide: BLOCKCHAIN_PORT, useClass: EthersBlockchainAdapter }],
  exports: [BLOCKCHAIN_PORT],
})
export class BlockchainModule {}
