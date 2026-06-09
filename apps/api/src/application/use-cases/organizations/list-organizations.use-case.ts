import { Inject, Injectable } from '@nestjs/common';
import { Organization } from '@certchain/shared';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepositoryPort,
} from '../../../domain/ports/organization.repository.port';

@Injectable()
export class ListOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepositoryPort,
  ) {}

  async execute(): Promise<Organization[]> {
    const orgs = await this.organizationRepository.findAll();
    return orgs.map((o) => this.organizationRepository.toDto(o));
  }
}
