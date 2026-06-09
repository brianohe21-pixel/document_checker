import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth.module';
import { BulkModule } from './modules/bulk.module';
import { CertificatesModule } from './modules/certificates.module';
import { OrganizationsModule } from './modules/organizations.module';
import { PrismaModule } from './modules/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    CertificatesModule,
    BulkModule,
  ],
})
export class AppModule {}
