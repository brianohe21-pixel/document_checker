import { Module } from '@nestjs/common';
import { EMAIL_PORT } from '../domain/ports/email.port';
import { ResendEmailAdapter } from '../infrastructure/email/resend-email.adapter';

@Module({
  providers: [{ provide: EMAIL_PORT, useClass: ResendEmailAdapter }],
  exports: [EMAIL_PORT],
})
export class EmailModule {}
