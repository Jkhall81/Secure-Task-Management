import { Injectable } from '@nestjs/common';

type RoleName = 'owner' | 'admin' | 'viewer';

interface RoleHierarchy {
  owner: RoleName[];
  admin: RoleName[];
  viewer: RoleName[];
}

@Injectable()
export class RoleHierarchyService {
  private readonly roleHierarchy: RoleHierarchy = {
    owner: ['admin', 'viewer'],
    admin: ['viewer'],
    viewer: [],
  };

  // Get all roles that a given role inherits from (including itself)
  getInheritedRoles(roleName: RoleName): RoleName[] {
    const inheritedRoles: RoleName[] = [roleName];
    const childRoles = this.roleHierarchy[roleName] || [];

    // Recursively get all inherited roles
    childRoles.forEach((childRole: RoleName) => {
      inheritedRoles.push(...this.getInheritedRoles(childRole));
    });

    // Remove duplicates using array methods instead of Set
    return inheritedRoles.filter(
      (role, index, array) => array.indexOf(role) === index
    );
  }

  // Check if a user role has access to a required role
  hasRoleAccess(userRole: RoleName, requiredRole: RoleName): boolean {
    const inheritedRoles = this.getInheritedRoles(userRole);
    return inheritedRoles.includes(requiredRole);
  }

  // Helper method to safely cast string to RoleName
  isValidRole(role: string): role is RoleName {
    return ['owner', 'admin', 'viewer'].includes(role);
  }
}
