import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BulkJob, IssueCertificateDto } from '@certchain/shared';
import { AuthenticatedUser } from '../../../domain/auth/auth-context';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
} from '../../../domain/ports/audit-log.repository.port';
import {
  BULK_JOB_REPOSITORY,
  BulkJobRepositoryPort,
} from '../../../domain/ports/bulk-job.repository.port';
import { BulkQueueService } from '../../../infrastructure/queue/bulk-queue.service';

const MAX_ROWS = 500;
const MAX_ACTIVE_JOBS = 5;

@Injectable()
export class CreateBulkJobUseCase {
  constructor(
    @Inject(BULK_JOB_REPOSITORY)
    private readonly bulkJobRepository: BulkJobRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
    private readonly bulkQueueService: BulkQueueService,
  ) {}

  async execute(
    user: AuthenticatedUser,
    rows: IssueCertificateDto[],
    fileName?: string,
  ): Promise<BulkJob> {
    if (!rows.length) {
      throw new BadRequestException('CSV has no data rows');
    }
    if (rows.length > MAX_ROWS) {
      throw new BadRequestException(`Maximum ${MAX_ROWS} rows per job`);
    }

    const activeJobs = await this.bulkJobRepository.countActiveByOrganization(user.organizationId);
    if (activeJobs >= MAX_ACTIVE_JOBS) {
      throw new BadRequestException('Too many active bulk jobs for this organization');
    }

    const items = rows.map((payload, index) => ({
      rowNumber: index + 1,
      payload,
    }));

    const job = await this.bulkJobRepository.create({
      organizationId: user.organizationId,
      createdByUserId: user.userId,
      fileName,
      items,
    });

    await this.auditLogRepository.create({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'BULK_CREATE',
      entityType: 'bulk_job',
      entityId: job.id,
      metadata: { totalRows: rows.length, fileName },
    });

    await this.bulkQueueService.enqueue(job.id);

    return this.bulkJobRepository.toDto(job);
  }
}
