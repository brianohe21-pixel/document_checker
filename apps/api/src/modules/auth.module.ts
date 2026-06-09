import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { SwitchOrganizationUseCase } from '../application/use-cases/switch-organization.use-case';
import { MEMBERSHIP_REPOSITORY } from '../domain/ports/membership.repository.port';
import { ORGANIZATION_REPOSITORY } from '../domain/ports/organization.repository.port';
import { USER_REPOSITORY } from '../domain/ports/user.repository.port';
import { PrismaMembershipRepository } from '../infrastructure/prisma/prisma-membership.repository';
import { PrismaOrganizationRepository } from '../infrastructure/prisma/prisma-organization.repository';
import { PrismaUserRepository } from '../infrastructure/prisma/prisma-user.repository';
import { AuthController } from '../presentation/controllers/auth.controller';
import { JwtStrategy } from '../presentation/strategies/jwt.strategy';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    GetMeUseCase,
    SwitchOrganizationUseCase,
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: PrismaMembershipRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
  ],
  exports: [JwtModule, MEMBERSHIP_REPOSITORY],
})
export class AuthModule {}
