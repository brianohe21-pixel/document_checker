import {
  CertificateTemplate,
  CreateTemplateDto,
  TemplateConfig,
  UpdateTemplateDto,
} from '@certchain/shared';

export interface TemplateRecord {
  id: string;
  organizationId: string;
  name: string;
  config: TemplateConfig;
  isDefault: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateRepositoryPort {
  findByOrganization(organizationId: string): Promise<TemplateRecord[]>;
  findById(id: string): Promise<TemplateRecord | null>;
  findByIdAndOrganization(id: string, organizationId: string): Promise<TemplateRecord | null>;
  findDefault(organizationId: string): Promise<TemplateRecord | null>;
  create(organizationId: string, dto: CreateTemplateDto): Promise<TemplateRecord>;
  update(id: string, organizationId: string, dto: UpdateTemplateDto): Promise<TemplateRecord>;
  toDto(record: TemplateRecord): CertificateTemplate;
}

export const TEMPLATE_REPOSITORY = Symbol('TEMPLATE_REPOSITORY');
