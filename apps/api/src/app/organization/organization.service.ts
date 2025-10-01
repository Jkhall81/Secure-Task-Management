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
    console.log('Creating user:', creatingUser?.id, creatingUser?.email);

    const org = this.orgRepo.create({ name });

    if (parentId) {
      const parent = await this.orgRepo.findOne({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent org not found');
      org.parent = parent;
    }

    // Associate the creating user with the organization
    if (creatingUser) {
      org.users = [creatingUser];
      console.log(
        'Set users on org:',
        org.users.map((u) => ({ id: u.id, email: u.email }))
      );
    }

    const savedOrg = await this.orgRepo.save(org);
    console.log('Organization saved with ID:', savedOrg.id);

    // Verify the relationship was created
    const orgWithUsers = await this.orgRepo.findOne({
      where: { id: savedOrg.id },
      relations: ['users'],
    });
    console.log(
      'Organization after save - users:',
      orgWithUsers?.users?.map((u) => u.id)
    );

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
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['organizations'], // Need to load organizations
    });
    if (!user) throw new NotFoundException('User not found');

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    // FIX: Properly handle the organizations array
    if (!user.organizations) {
      user.organizations = [org];
    } else {
      // Check if user is already in this org
      const alreadyInOrg = user.organizations.some(
        (userOrg) => userOrg.id === orgId
      );
      if (!alreadyInOrg) {
        user.organizations.push(org);
      }
    }

    return this.userRepo.save(user);
  }

  async getOrgScope(orgId: number): Promise<number[]> {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['children'],
    });
    if (!org) throw new NotFoundException('Organization not found');

    // include parent org + its children
    return [org.id, ...org.children.map((c) => c.id)];
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
