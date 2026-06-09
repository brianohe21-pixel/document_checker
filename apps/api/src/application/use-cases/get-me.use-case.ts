import { Inject, Injectable } from '@nestjs/common';
import { AuthMeResponse } from '@certchain/shared';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepositoryPort,
} from '../../domain/ports/membership.repository.port';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepositoryPort,
} from '../../domain/ports/organization.repository.port';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepositoryPort,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepositoryPort,
  ) {}

  async execute(user: AuthenticatedUser): Promise<AuthMeResponse> {
    const org = await this.organizationRepository.findById(user.organizationId);
    const memberships = await this.membershipRepository.findByUserId(user.userId);
    const organizations = await this.membershipRepository.toOrganizationSummaries(memberships);

    return {
      id: user.userId,
      email: user.email,
      organizationId: user.organizationId,
      organizationName: org?.name ?? '',
      organizationSlug: org?.slug ?? '',
      role: user.role,
      memberships: organizations,
    };
  }
}
