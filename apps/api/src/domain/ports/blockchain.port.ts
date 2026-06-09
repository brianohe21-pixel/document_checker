import { OnChainCertificate } from '@certchain/shared';

export interface BlockchainPort {
  registerCertificate(certificateId: string, documentHash: string): Promise<string>;
  revokeCertificate(certificateId: string): Promise<string>;
  verifyCertificate(certificateId: string): Promise<OnChainCertificate>;
}

export const BLOCKCHAIN_PORT = Symbol('BLOCKCHAIN_PORT');
