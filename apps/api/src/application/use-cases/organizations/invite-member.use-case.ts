import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InviteMemberDto, Membership, MembershipRole } from '@certchain/shared';
import { AuthenticatedUser } from '../../../domain/auth/auth-context';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
} from '../../../domain/ports/audit-log.repository.port';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepositoryPort,
} from '../../../domain/ports/membership.repository.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async execute(
    user: AuthenticatedUser,
    organizationId: string,
    dto: InviteMemberDto,
  ): Promise<Membership> {
    if (dto.role === 'SUPER_ADMIN') {
      throw new ConflictException('Cannot assign SUPER_ADMIN via invite');
    }

    let targetUser = await this.userRepository.findByEmail(dto.email);

    if (!targetUser) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      targetUser = await this.userRepository.create(dto.email, passwordHash);
    }

    const existing = await this.membershipRepository.findByUserAndOrganization(
      targetUser.id,
      organizationId,
    );
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    const membership = await this.membershipRepository.create({
      userId: targetUser.id,
      organizationId,
      role: dto.role as MembershipRole,
    });

    await this.auditLogRepository.create({
      organizationId,
      userId: user.userId,
      action: 'INVITE_MEMBER',
      entityType: 'membership',
      entityId: membership.id,
      metadata: { email: dto.email, role: dto.role },
    });

    return {
      id: membership.id,
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      email: membership.email,
      createdAt: membership.createdAt.toISOString(),
    };
  }
}
