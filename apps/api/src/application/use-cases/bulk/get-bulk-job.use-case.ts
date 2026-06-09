import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BulkJobDetail } from '@certchain/shared';
import { AuthenticatedUser } from '../../../domain/auth/auth-context';
import {
  BULK_JOB_REPOSITORY,
  BulkJobRepositoryPort,
} from '../../../domain/ports/bulk-job.repository.port';

@Injectable()
export class GetBulkJobUseCase {
  constructor(
    @Inject(BULK_JOB_REPOSITORY)
    private readonly bulkJobRepository: BulkJobRepositoryPort,
  ) {}

  async execute(user: AuthenticatedUser, jobId: string): Promise<BulkJobDetail> {
    const job = await this.bulkJobRepository.findByIdAndOrganization(jobId, user.organizationId);
    if (!job) throw new NotFoundException('Bulk job not found');

    const items = await this.bulkJobRepository.findItems(jobId);
    return this.bulkJobRepository.toDetail(job, items);
  }
}
