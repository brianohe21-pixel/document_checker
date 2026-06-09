import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const BULK_ISSUE_QUEUE = 'bulk-issue';

@Injectable()
export class BulkQueueService {
  constructor(@InjectQueue(BULK_ISSUE_QUEUE) private readonly queue: Queue) {}

  async enqueue(jobId: string): Promise<void> {
    await this.queue.add('process', { jobId }, { jobId });
  }
}
