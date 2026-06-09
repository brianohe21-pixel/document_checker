import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipRole } from '@certchain/shared';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as AuthenticatedUser;
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
