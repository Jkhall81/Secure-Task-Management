import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true; // no roles → public route
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('User not found in request');

    // DEBUG: Log what we're checking
    console.log('RolesGuard Debug:', {
      requiredRoles,
      userRole: user.role,
      userRoleName: user.role?.name,
    });

    // FIX: Check user.role.name instead of user.role
    if (!user.role || !requiredRoles.includes(user.role.name)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
