import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Organization, UpdateOrganizationDto } from '@certchain/shared';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepositoryPort,
} from '../../../domain/ports/organization.repository.port';

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.organizationRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    const updated = await this.organizationRepository.update(id, dto);
    return this.organizationRepository.toDto(updated);
  }
}
