import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(email: string, passwordHash: string): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
