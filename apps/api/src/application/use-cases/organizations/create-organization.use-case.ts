import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateOrganizationDto, Organization } from '@certchain/shared';
import { DEFAULT_TEMPLATE_CONFIG } from '@certchain/shared';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepositoryPort,
} from '../../../domain/ports/organization.repository.port';
import {
  TEMPLATE_REPOSITORY,
  TemplateRepositoryPort,
} from '../../../domain/ports/template.repository.port';

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepositoryPort,
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.organizationRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    const org = await this.organizationRepository.create(dto);

    await this.templateRepository.create(org.id, {
      name: 'Default Template',
      config: DEFAULT_TEMPLATE_CONFIG,
      isDefault: true,
    });

    return this.organizationRepository.toDto(org);
  }
}
