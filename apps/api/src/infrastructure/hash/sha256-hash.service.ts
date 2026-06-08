import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { HashServicePort } from '../../domain/ports/hash.service.port';

@Injectable()
export class Sha256HashService implements HashServicePort {
  sha256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
