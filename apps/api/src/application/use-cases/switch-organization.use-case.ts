import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginResponse } from '@certchain/shared';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepositoryPort,
} from '../../domain/ports/membership.repository.port';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SwitchOrganizationUseCase {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async execute(user: AuthenticatedUser, organizationId: string): Promise<LoginResponse> {
    const membership = await this.membershipRepository.findByUserAndOrganization(
      user.userId,
      organizationId,
    );

    if (!membership) {
      throw new UnauthorizedException('No access to organization');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      email: user.email,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    const memberships = await this.membershipRepository.findByUserId(user.userId);
    const organizations = await this.membershipRepository.toOrganizationSummaries(memberships);

    return { accessToken, organizations };
  }
}
