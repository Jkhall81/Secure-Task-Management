// api/src/app/seeds/role-permission.seed.ts
import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';

export async function seedRolesAndPermissions(dataSource: DataSource) {
  const permRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);

  // Define all permissions
  const permissions = [
    'CREATE_TASK',
    'UPDATE_TASK',
    'DELETE_TASK',
    'VIEW_TASK',
    'VIEW_AUDIT_LOG',
  ];

  // Ensure permissions exist in DB
  const savedPerms: Permission[] = [];
  for (const name of permissions) {
    let perm = await permRepo.findOne({ where: { name } });
    if (!perm) {
      perm = permRepo.create({ name });
      await permRepo.save(perm);
    }
    savedPerms.push(perm);
  }

  // Destructure for readability
  const [createTask, updateTask, deleteTask, viewTask, viewAuditLog] =
    savedPerms;

  // Define roles with permissions
  const rolesConfig: Record<string, Permission[]> = {
    owner: [createTask, updateTask, deleteTask, viewTask, viewAuditLog],
    admin: [createTask, updateTask, deleteTask, viewTask],
    viewer: [viewTask],
  };

  // Ensure roles exist and update their permissions
  for (const [roleName, perms] of Object.entries(rolesConfig)) {
    let role = await roleRepo.findOne({
      where: { name: roleName },
      relations: ['permissions'],
    });

    if (!role) {
      role = roleRepo.create({ name: roleName, permissions: perms });
    } else {
      role.permissions = perms;
    }

    await roleRepo.save(role);
  }

  console.log('Roles & Permissions seeded');
}
