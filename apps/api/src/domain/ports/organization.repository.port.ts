import { CreateOrganizationDto, Organization, UpdateOrganizationDto } from '@certchain/shared';

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  verifyBaseUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface OrganizationRepositoryPort {
  findAll(): Promise<OrganizationRecord[]>;
  findById(id: string): Promise<OrganizationRecord | null>;
  findBySlug(slug: string): Promise<OrganizationRecord | null>;
  create(dto: CreateOrganizationDto): Promise<OrganizationRecord>;
  update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationRecord>;
  toDto(record: OrganizationRecord): Organization;
}

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
