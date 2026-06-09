import { Injectable } from '@nestjs/common';
import {
  CertificateTemplate,
  CreateTemplateDto,
  TemplateConfig,
  UpdateTemplateDto,
} from '@certchain/shared';
import {
  TemplateRecord,
  TemplateRepositoryPort,
} from '../../domain/ports/template.repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTemplateRepository implements TemplateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganization(organizationId: string): Promise<TemplateRecord[]> {
    const records = await this.prisma.certificateTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toRecord(r));
  }

  async findById(id: string): Promise<TemplateRecord | null> {
    const record = await this.prisma.certificateTemplate.findUnique({ where: { id } });
    return record ? this.toRecord(record) : null;
  }

  async findByIdAndOrganization(
    id: string,
    organizationId: string,
  ): Promise<TemplateRecord | null> {
    const record = await this.prisma.certificateTemplate.findFirst({
      where: { id, organizationId },
    });
    return record ? this.toRecord(record) : null;
  }

  async findDefault(organizationId: string): Promise<TemplateRecord | null> {
    const record = await this.prisma.certificateTemplate.findFirst({
      where: { organizationId, isDefault: true },
    });
    return record ? this.toRecord(record) : null;
  }

  async create(organizationId: string, dto: CreateTemplateDto): Promise<TemplateRecord> {
    if (dto.isDefault) {
      await this.prisma.certificateTemplate.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const record = await this.prisma.certificateTemplate.create({
      data: {
        organizationId,
        name: dto.name,
        config: dto.config as object,
        isDefault: dto.isDefault ?? false,
      },
    });
    return this.toRecord(record);
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateTemplateDto,
  ): Promise<TemplateRecord> {
    if (dto.isDefault) {
      await this.prisma.certificateTemplate.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const record = await this.prisma.certificateTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        config: dto.config as object | undefined,
        isDefault: dto.isDefault,
        version: dto.config ? { increment: 1 } : undefined,
      },
    });
    return this.toRecord(record);
  }

  toDto(record: TemplateRecord): CertificateTemplate {
    return {
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      config: record.config,
      isDefault: record.isDefault,
      version: record.version,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private toRecord(record: {
    id: string;
    organizationId: string;
    name: string;
    config: unknown;
    isDefault: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): TemplateRecord {
    return {
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      config: record.config as TemplateConfig,
      isDefault: record.isDefault,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
