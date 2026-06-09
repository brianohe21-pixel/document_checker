import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    if (!record) return null;
    return new User(record.id, record.email, record.passwordHash, record.createdAt);
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    if (!record) return null;
    return new User(record.id, record.email, record.passwordHash, record.createdAt);
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const record = await this.prisma.user.create({
      data: { email, passwordHash },
    });
    return new User(record.id, record.email, record.passwordHash, record.createdAt);
  }
}
