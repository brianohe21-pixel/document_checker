import { Injectable } from '@nestjs/common';
import {
  BulkJob,
  BulkJobDetail,
  BulkJobItem,
  BulkJobItemStatus,
  BulkJobStatus,
  IssueCertificateDto,
} from '@certchain/shared';
import {
  BulkJobItemRecord,
  BulkJobRecord,
  BulkJobRepositoryPort,
} from '../../domain/ports/bulk-job.repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaBulkJobRepository implements BulkJobRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    createdByUserId: string;
    fileName?: string;
    items: { rowNumber: number; payload: IssueCertificateDto }[];
  }): Promise<BulkJobRecord> {
    return this.prisma.bulkJob.create({
      data: {
        organizationId: data.organizationId,
        createdByUserId: data.createdByUserId,
        fileName: data.fileName,
        totalRows: data.items.length,
        items: {
          create: data.items.map((item) => ({
            rowNumber: item.rowNumber,
            payload: item.payload as object,
          })),
        },
      },
    });
  }

  async findById(id: string): Promise<BulkJobRecord | null> {
    return this.prisma.bulkJob.findUnique({ where: { id } });
  }

  async findByIdAndOrganization(id: string, organizationId: string): Promise<BulkJobRecord | null> {
    return this.prisma.bulkJob.findFirst({ where: { id, organizationId } });
  }

  async findItems(bulkJobId: string): Promise<BulkJobItemRecord[]> {
    const items = await this.prisma.bulkJobItem.findMany({
      where: { bulkJobId },
      orderBy: { rowNumber: 'asc' },
    });
    return items.map((item) => ({
      id: item.id,
      bulkJobId: item.bulkJobId,
      rowNumber: item.rowNumber,
      payload: item.payload as unknown as IssueCertificateDto,
      status: item.status as BulkJobItemStatus,
      certificateId: item.certificateId,
      error: item.error,
    }));
  }

  async countActiveByOrganization(organizationId: string): Promise<number> {
    return this.prisma.bulkJob.count({
      where: {
        organizationId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });
  }

  async updateStatus(id: string, status: BulkJobStatus): Promise<void> {
    await this.prisma.bulkJob.update({ where: { id }, data: { status } });
  }

  async incrementProgress(id: string, success: boolean): Promise<void> {
    await this.prisma.bulkJob.update({
      where: { id },
      data: {
        processedRows: { increment: 1 },
        failedRows: success ? undefined : { increment: 1 },
      },
    });
  }

  async updateItem(
    id: string,
    data: { status: BulkJobItemStatus; certificateId?: string; error?: string },
  ): Promise<void> {
    await this.prisma.bulkJobItem.update({
      where: { id },
      data: {
        status: data.status,
        certificateId: data.certificateId,
        error: data.error,
      },
    });
  }

  async markCompleted(id: string): Promise<void> {
    await this.prisma.bulkJob.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  toDto(record: BulkJobRecord): BulkJob {
    return {
      id: record.id,
      organizationId: record.organizationId,
      status: record.status as BulkJobStatus,
      totalRows: record.totalRows,
      processedRows: record.processedRows,
      failedRows: record.failedRows,
      fileName: record.fileName ?? undefined,
      createdAt: record.createdAt.toISOString(),
      completedAt: record.completedAt?.toISOString(),
    };
  }

  toDetail(record: BulkJobRecord, items: BulkJobItemRecord[]): BulkJobDetail {
    return {
      ...this.toDto(record),
      items: items.map((item) => this.toItemDto(item)),
    };
  }

  toItemDto(record: BulkJobItemRecord): BulkJobItem {
    return {
      id: record.id,
      rowNumber: record.rowNumber,
      status: record.status,
      certificateId: record.certificateId ?? undefined,
      error: record.error ?? undefined,
      payload: record.payload,
    };
  }
}
