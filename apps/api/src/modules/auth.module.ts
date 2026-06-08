import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { USER_REPOSITORY } from '../domain/ports/user.repository.port';
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
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
})
export class AuthModule {}
