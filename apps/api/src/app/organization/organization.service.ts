import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>
  ) {}

  async create(name: string, parentId?: number, creatingUser?: User) {
    console.log('=== CREATING ORGANIZATION ===');
    console.log('Name:', name);
    console.log('Creating user ID:', creatingUser?.id);

    // Create organization using TypeORM (this part works fine)
    const org = this.orgRepo.create({ name });

    if (parentId) {
      const parent = await this.orgRepo.findOne({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent org not found');
      org.parent = parent;
    }

    const savedOrg = await this.orgRepo.save(org);
    console.log('Organization saved with ID:', savedOrg.id);

    // MANUALLY handle the junction table - this is the key fix
    if (creatingUser) {
      console.log(
        'Manually creating junction for user:',
        creatingUser.id,
        'org:',
        savedOrg.id
      );

      await this.orgRepo.manager.query(
        `INSERT INTO user_organizations_organization (userId, organizationId) VALUES (?, ?)`,
        [creatingUser.id, savedOrg.id]
      );
      console.log('Junction table entry created successfully');
    }

    return savedOrg;
  }

  async findPublicOrgs() {
    return this.orgRepo.find({
      select: ['id', 'name'], // only return safe fields
    });
  }

  async findAll() {
    return this.orgRepo.find({ relations: ['users'] });
  }

  async findAllWithChildren() {
    return this.orgRepo.find({ relations: ['users', 'children', 'parent'] });
  }

  async addUserToOrg(userId: number, orgId: number) {
    console.log(`Adding user ${userId} to organization ${orgId}`);

    // Use raw SQL to avoid any TypeORM relationship issues
    try {
      await this.orgRepo.manager.query(
        `INSERT OR IGNORE INTO user_organizations_organization (userId, organizationId) VALUES (?, ?)`,
        [userId, orgId]
      );
      console.log(`Successfully added user ${userId} to organization ${orgId}`);
    } catch (error) {
      console.error(
        `Failed to add user ${userId} to organization ${orgId}:`,
        error
      );
      throw error;
    }

    // Return the updated user
    return await this.userRepo.findOne({
      where: { id: userId },
      relations: ['organizations'],
    });
  }

  async getOrgScope(orgId: number): Promise<number[]> {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['children'],
    });
    if (!org) throw new NotFoundException('Organization not found');

    // Recursively get all child org IDs
    const getAllChildIds = async (parentId: number): Promise<number[]> => {
      const children = await this.orgRepo.find({
        where: { parent: { id: parentId } },
        relations: ['children'],
      });

      let childIds = children.map((child) => child.id);

      for (const child of children) {
        const grandChildren = await getAllChildIds(child.id);
        childIds = [...childIds, ...grandChildren];
      }

      return childIds;
    };

    const childIds = await getAllChildIds(orgId);
    return [orgId, ...childIds];
  }

  async remove(orgId: number, user: User) {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['users', 'children', 'tasks'],
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user has permission
    const userInOrg = org.users.some((orgUser) => orgUser.id === user.id);
    if (!userInOrg) {
      throw new ForbiddenException(
        'You do not have permission to delete this organization'
      );
    }

    try {
      // Use transaction for atomic operations
      return await this.orgRepo.manager.transaction(
        async (transactionalEntityManager) => {
          // STEP 1: Handle audit logs FIRST (this is what's blocking deletion)
          const auditLogs = await transactionalEntityManager.find(AuditLog, {
            where: { organization: { id: orgId } },
          });

          if (auditLogs.length > 0) {
            // Set organization to null for all audit logs
            for (const auditLog of auditLogs) {
              auditLog.organization = null;
              await transactionalEntityManager.save(auditLog);
            }
          }

          // STEP 2: Remove organization from all users (clear junction table)
          for (const user of org.users) {
            const userWithOrgs = await transactionalEntityManager.findOne(
              User,
              {
                where: { id: user.id },
                relations: ['organizations'],
              }
            );

            if (userWithOrgs && userWithOrgs.organizations) {
              userWithOrgs.organizations = userWithOrgs.organizations.filter(
                (userOrg) => userOrg.id !== orgId
              );
              await transactionalEntityManager.save(userWithOrgs);
            }
          }

          // STEP 3: Handle child organizations (set their parent to null)
          if (org.children && org.children.length > 0) {
            for (const child of org.children) {
              child.parent = null;
              await transactionalEntityManager.save(child);
            }
          }

          // STEP 4: Handle tasks (set their organization to null)
          if (org.tasks && org.tasks.length > 0) {
            for (const task of org.tasks) {
              task.organization = null;
              await transactionalEntityManager.save(task);
            }
          }

          // STEP 5: Now delete the organization
          await transactionalEntityManager.remove(org);

          return { message: 'Organization deleted successfully' };
        }
      );
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw new BadRequestException(
        'Failed to delete organization: ' + error.message
      );
    }
  }
}
