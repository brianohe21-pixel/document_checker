import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUseCase } from './login.use-case';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { MembershipRepositoryPort } from '../../domain/ports/membership.repository.port';
import { User } from '../../domain/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('LoginUseCase', () => {
  const user = new User('user-1', 'admin@test.com', 'hashed', new Date());
  const ORG_ID = '00000000-0000-0000-0000-000000000001';

  const mockRepo: UserRepositoryPort = {
    findByEmail: jest.fn().mockResolvedValue(user),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockMembership: MembershipRepositoryPort = {
    findByUserId: jest.fn().mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-1',
        organizationId: ORG_ID,
        role: 'SUPER_ADMIN',
        email: 'admin@test.com',
        createdAt: new Date(),
      },
    ]),
    findByUserAndOrganization: jest.fn(),
    findByUserAndSlug: jest.fn(),
    findByOrganization: jest.fn(),
    create: jest.fn(),
    updateRole: jest.fn(),
    toOrganizationSummaries: jest
      .fn()
      .mockResolvedValue([{ id: ORG_ID, name: 'Default', slug: 'default', role: 'SUPER_ADMIN' }]),
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  } as unknown as JwtService;

  const useCase = new LoginUseCase(mockRepo, mockMembership, mockJwt);

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRepo.findByEmail as jest.Mock).mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('should return access token on valid credentials', async () => {
    const result = await useCase.execute({ email: 'admin@test.com', password: 'pass' });
    expect(result.accessToken).toBe('jwt-token');
  });

  it('should throw on unknown user', async () => {
    (mockRepo.findByEmail as jest.Mock).mockResolvedValueOnce(null);
    await expect(useCase.execute({ email: 'unknown@test.com', password: 'pass' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw on invalid password', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    await expect(useCase.execute({ email: 'admin@test.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
