import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateBulkJobUseCase } from '../application/use-cases/bulk/create-bulk-job.use-case';
import { GetBulkJobUseCase } from '../application/use-cases/bulk/get-bulk-job.use-case';
import { AUDIT_LOG_REPOSITORY } from '../domain/ports/audit-log.repository.port';
import { BULK_JOB_REPOSITORY } from '../domain/ports/bulk-job.repository.port';
import { PrismaAuditLogRepository } from '../infrastructure/prisma/prisma-audit-log.repository';
import { PrismaBulkJobRepository } from '../infrastructure/prisma/prisma-bulk-job.repository';
import { BulkProcessor } from '../infrastructure/queue/bulk.processor';
import { BULK_ISSUE_QUEUE, BulkQueueService } from '../infrastructure/queue/bulk-queue.service';
import { BulkController } from '../presentation/controllers/bulk.controller';
import { RolesGuard } from '../presentation/guards/roles.guard';
import { CertificatesModule } from './certificates.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    CertificatesModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue({ name: BULK_ISSUE_QUEUE }),
  ],
  controllers: [BulkController],
  providers: [
    CreateBulkJobUseCase,
    GetBulkJobUseCase,
    BulkQueueService,
    BulkProcessor,
    RolesGuard,
    { provide: BULK_JOB_REPOSITORY, useClass: PrismaBulkJobRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  ],
  exports: [CreateBulkJobUseCase, GetBulkJobUseCase, BULK_JOB_REPOSITORY],
})
export class BulkModule {}
