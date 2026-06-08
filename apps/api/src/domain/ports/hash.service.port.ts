export interface HashServicePort {
  sha256(buffer: Buffer): string;
}

export const HASH_SERVICE = Symbol('HASH_SERVICE');
