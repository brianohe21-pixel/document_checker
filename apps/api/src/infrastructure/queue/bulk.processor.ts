import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IssueCertificateUseCase } from '../../application/use-cases/issue-certificate.use-case';
import {
  BULK_JOB_REPOSITORY,
  BulkJobRepositoryPort,
} from '../../domain/ports/bulk-job.repository.port';
import { BULK_ISSUE_QUEUE } from './bulk-queue.service';
import { ConfigService } from '@nestjs/config';

@Processor(BULK_ISSUE_QUEUE)
export class BulkProcessor extends WorkerHost {
  private readonly logger = new Logger(BulkProcessor.name);

  constructor(
    @Inject(BULK_JOB_REPOSITORY)
    private readonly bulkJobRepository: BulkJobRepositoryPort,
    private readonly issueCertificateUseCase: IssueCertificateUseCase,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ jobId: string }>): Promise<void> {
    const { jobId } = job.data;
    const bulkJob = await this.bulkJobRepository.findById(jobId);
    if (!bulkJob) return;

    await this.bulkJobRepository.updateStatus(jobId, 'PROCESSING');

    const items = await this.bulkJobRepository.findItems(jobId);
    const delayMs = this.configService.get<number>('BULK_TX_DELAY_MS', 1000);

    for (const item of items) {
      if (item.status !== 'PENDING') continue;

      try {
        const result = await this.issueWithRetry(item.payload, {
          organizationId: bulkJob.organizationId,
          issuedByUserId: bulkJob.createdByUserId,
          skipEmail: false,
        });

        await this.bulkJobRepository.updateItem(item.id, {
          status: 'SUCCESS',
          certificateId: result.certificateId,
        });
        await this.bulkJobRepository.incrementProgress(jobId, true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Bulk item ${item.rowNumber} failed: ${message}`);
        await this.bulkJobRepository.updateItem(item.id, {
          status: 'FAILED',
          error: message,
        });
        await this.bulkJobRepository.incrementProgress(jobId, false);
      }

      await this.sleep(delayMs);
    }

    await this.bulkJobRepository.markCompleted(jobId);
  }

  private async issueWithRetry(
    dto: Parameters<IssueCertificateUseCase['execute']>[0],
    context: Parameters<IssueCertificateUseCase['execute']>[1],
    maxAttempts = 3,
  ) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.issueCertificateUseCase.execute(dto, context);
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : '';
        const transient =
          message.includes('network') ||
          message.includes('timeout') ||
          message.includes('ECONNRESET');
        if (!transient || attempt === maxAttempts) throw error;
        await this.sleep(500 * attempt);
      }
    }
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
