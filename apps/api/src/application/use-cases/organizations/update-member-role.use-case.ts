import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Membership, UpdateMemberRoleDto } from '@certchain/shared';
import { AuthenticatedUser } from '../../../domain/auth/auth-context';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
} from '../../../domain/ports/audit-log.repository.port';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepositoryPort,
} from '../../../domain/ports/membership.repository.port';

@Injectable()
export class UpdateMemberRoleUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async execute(
    user: AuthenticatedUser,
    organizationId: string,
    membershipId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<Membership> {
    if (dto.role === 'SUPER_ADMIN') {
      throw new ConflictException('Cannot assign SUPER_ADMIN');
    }

    const members = await this.membershipRepository.findByOrganization(organizationId);
    const member = members.find((m) => m.id === membershipId);
    if (!member) throw new NotFoundException('Member not found');

    const updated = await this.membershipRepository.updateRole(membershipId, dto.role);

    await this.auditLogRepository.create({
      organizationId,
      userId: user.userId,
      action: 'UPDATE_MEMBER_ROLE',
      entityType: 'membership',
      entityId: membershipId,
      metadata: { role: dto.role },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      organizationId: updated.organizationId,
      role: updated.role,
      email: updated.email,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
