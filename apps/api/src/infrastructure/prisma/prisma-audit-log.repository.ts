import { Injectable } from '@nestjs/common';
import { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata as object | undefined,
      },
    });
  }
}
