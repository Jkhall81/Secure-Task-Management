import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RoleHierarchyService } from 'libs/auth/src/lib/role-hierarchy.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleHierarchy: RoleHierarchyService // Inject the service
  ) {}

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

    // NEW: Check with role inheritance instead of direct match
    if (!user.role || !user.role.name) {
      throw new ForbiddenException('Invalid user role');
    }

    // Validate that the user role is a valid RoleName
    if (!this.roleHierarchy.isValidRole(user.role.name)) {
      throw new ForbiddenException('Invalid user role type');
    }

    // Check if user has access to any of the required roles via inheritance
    const hasAccess = requiredRoles.some((requiredRole) => {
      // Validate required role is also a valid RoleName
      if (!this.roleHierarchy.isValidRole(requiredRole)) {
        return false;
      }
      return this.roleHierarchy.hasRoleAccess(user.role.name, requiredRole);
    });

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
