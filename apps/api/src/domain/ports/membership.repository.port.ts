import { MembershipRole, OrganizationSummary } from '@certchain/shared';

export interface MembershipRecord {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  email: string;
  createdAt: Date;
}

export interface MembershipRepositoryPort {
  findByUserId(userId: string): Promise<MembershipRecord[]>;
  findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<MembershipRecord | null>;
  findByUserAndSlug(userId: string, slug: string): Promise<MembershipRecord | null>;
  findByOrganization(organizationId: string): Promise<MembershipRecord[]>;
  create(data: {
    userId: string;
    organizationId: string;
    role: MembershipRole;
  }): Promise<MembershipRecord>;
  updateRole(id: string, role: MembershipRole): Promise<MembershipRecord>;
  toOrganizationSummaries(records: MembershipRecord[]): Promise<OrganizationSummary[]>;
}

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');
