import {
  BulkJob,
  BulkJobDetail,
  BulkJobItem,
  BulkJobItemStatus,
  BulkJobStatus,
  IssueCertificateDto,
} from '@certchain/shared';

export interface BulkJobRecord {
  id: string;
  organizationId: string;
  status: BulkJobStatus;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  fileName: string | null;
  createdByUserId: string;
  createdAt: Date;
  completedAt: Date | null;
}

export interface BulkJobItemRecord {
  id: string;
  bulkJobId: string;
  rowNumber: number;
  payload: IssueCertificateDto;
  status: BulkJobItemStatus;
  certificateId: string | null;
  error: string | null;
}

export interface BulkJobRepositoryPort {
  create(data: {
    organizationId: string;
    createdByUserId: string;
    fileName?: string;
    items: { rowNumber: number; payload: IssueCertificateDto }[];
  }): Promise<BulkJobRecord>;
  findById(id: string): Promise<BulkJobRecord | null>;
  findByIdAndOrganization(id: string, organizationId: string): Promise<BulkJobRecord | null>;
  findItems(bulkJobId: string): Promise<BulkJobItemRecord[]>;
  countActiveByOrganization(organizationId: string): Promise<number>;
  updateStatus(id: string, status: BulkJobStatus): Promise<void>;
  incrementProgress(id: string, success: boolean): Promise<void>;
  updateItem(
    id: string,
    data: { status: BulkJobItemStatus; certificateId?: string; error?: string },
  ): Promise<void>;
  markCompleted(id: string): Promise<void>;
  toDto(record: BulkJobRecord): BulkJob;
  toDetail(record: BulkJobRecord, items: BulkJobItemRecord[]): BulkJobDetail;
  toItemDto(record: BulkJobItemRecord): BulkJobItem;
}

export const BULK_JOB_REPOSITORY = Symbol('BULK_JOB_REPOSITORY');
