import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto, Organization, UpdateOrganizationDto } from '@certchain/shared';
import {
  OrganizationRecord,
  OrganizationRepositoryPort,
} from '../../domain/ports/organization.repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrganizationRecord[]> {
    return this.prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<OrganizationRecord | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }

  async create(dto: CreateOrganizationDto): Promise<OrganizationRecord> {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        verifyBaseUrl: dto.verifyBaseUrl,
      },
    });
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationRecord> {
    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        verifyBaseUrl: dto.verifyBaseUrl,
        isActive: dto.isActive,
      },
    });
  }

  toDto(record: OrganizationRecord): Organization {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      logoUrl: record.logoUrl ?? undefined,
      primaryColor: record.primaryColor ?? undefined,
      verifyBaseUrl: record.verifyBaseUrl ?? undefined,
      isActive: record.isActive,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
