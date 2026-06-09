import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '@certchain/shared';
import { AuthenticatedUser } from '../../../domain/auth/auth-context';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepositoryPort,
} from '../../../domain/ports/organization.repository.port';

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepositoryPort,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<Organization> {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      throw new ForbiddenException('Access denied');
    }

    const org = await this.organizationRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    return this.organizationRepository.toDto(org);
  }
}
