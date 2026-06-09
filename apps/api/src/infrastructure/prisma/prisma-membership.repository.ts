import { Injectable } from '@nestjs/common';
import { MembershipRole, OrganizationSummary } from '@certchain/shared';
import {
  MembershipRecord,
  MembershipRepositoryPort,
} from '../../domain/ports/membership.repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaMembershipRepository implements MembershipRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<MembershipRecord[]> {
    const records = await this.prisma.membership.findMany({
      where: { userId },
      include: { user: true, organization: true },
    });
    return records.map((r) => this.toRecord(r));
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<MembershipRecord | null> {
    const record = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { user: true, organization: true },
    });
    return record ? this.toRecord(record) : null;
  }

  async findByUserAndSlug(userId: string, slug: string): Promise<MembershipRecord | null> {
    const record = await this.prisma.membership.findFirst({
      where: { userId, organization: { slug } },
      include: { user: true, organization: true },
    });
    return record ? this.toRecord(record) : null;
  }

  async findByOrganization(organizationId: string): Promise<MembershipRecord[]> {
    const records = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: true, organization: true },
    });
    return records.map((r) => this.toRecord(r));
  }

  async create(data: {
    userId: string;
    organizationId: string;
    role: MembershipRole;
  }): Promise<MembershipRecord> {
    const record = await this.prisma.membership.create({
      data,
      include: { user: true, organization: true },
    });
    return this.toRecord(record);
  }

  async updateRole(id: string, role: MembershipRole): Promise<MembershipRecord> {
    const record = await this.prisma.membership.update({
      where: { id },
      data: { role },
      include: { user: true, organization: true },
    });
    return this.toRecord(record);
  }

  async toOrganizationSummaries(records: MembershipRecord[]): Promise<OrganizationSummary[]> {
    const orgIds = [...new Set(records.map((r) => r.organizationId))];
    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: orgIds }, isActive: true },
    });
    const orgMap = new Map(orgs.map((o) => [o.id, o]));

    return records
      .filter((r) => orgMap.has(r.organizationId))
      .map((r) => {
        const org = orgMap.get(r.organizationId)!;
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: r.role,
        };
      });
  }

  private toRecord(record: {
    id: string;
    userId: string;
    organizationId: string;
    role: MembershipRole;
    createdAt: Date;
    user: { email: string };
  }): MembershipRecord {
    return {
      id: record.id,
      userId: record.userId,
      organizationId: record.organizationId,
      role: record.role,
      email: record.user.email,
      createdAt: record.createdAt,
    };
  }
}
