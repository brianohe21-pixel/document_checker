import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, LoginResponse } from '@certchain/shared';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepositoryPort,
} from '../../domain/ports/membership.repository.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const memberships = await this.membershipRepository.findByUserId(user.id);
    if (!memberships.length) {
      throw new UnauthorizedException('No organization access');
    }

    const organizations = await this.membershipRepository.toOrganizationSummaries(memberships);

    let selected = memberships[0];

    if (dto.organizationId) {
      const match = memberships.find((m) => m.organizationId === dto.organizationId);
      if (!match) throw new UnauthorizedException('No access to organization');
      selected = match;
    } else if (dto.organizationSlug) {
      const match = await this.membershipRepository.findByUserAndSlug(
        user.id,
        dto.organizationSlug,
      );
      if (!match) throw new UnauthorizedException('No access to organization');
      selected = match;
    } else if (organizations.length > 1) {
      return {
        requiresOrganizationSelection: true,
        organizations,
      };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      organizationId: selected.organizationId,
      role: selected.role,
    });

    return { accessToken, organizations };
  }
}
