import { Inject, Injectable } from '@nestjs/common';
import { Membership } from '@certchain/shared';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepositoryPort,
} from '../../../domain/ports/membership.repository.port';

@Injectable()
export class ListMembersUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepositoryPort,
  ) {}

  async execute(organizationId: string): Promise<Membership[]> {
    const members = await this.membershipRepository.findByOrganization(organizationId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role,
      email: m.email,
      createdAt: m.createdAt.toISOString(),
    }));
  }
}
