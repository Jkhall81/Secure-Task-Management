import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly auditLogService: AuditLogService,
    private readonly orgService: OrganizationService
  ) {}

  async create(body: any, user: User) {
    console.log('=== BACKEND TASK CREATION ===');
    console.log('Received body:', body);
    console.log('User:', user.id, user.email);

    const organizationId = body.organizationId || user.organizations?.[0]?.id;

    console.log('Organization ID to use:', organizationId);

    const org = await this.orgRepo.findOne({ where: { id: organizationId } });
    console.log('Found organization:', org);

    if (!org) throw new BadRequestException('Organization not found');

    const task = this.taskRepo.create({
      title: body.title,
      description: body.description,
      status: body.status || 'pending',
      category: body.category || 'work',
      organization: org,
      createdBy: user, // Changed from 'owner' to 'createdBy'
      createdById: user.id, // Add this line
    });

    console.log('Task entity created:', task);

    try {
      const saved = await this.taskRepo.save(task);
      console.log('Task saved successfully:', saved.id, saved.title);

      // Verify it was actually saved
      const verified = await this.taskRepo.findOne({ where: { id: saved.id } });
      console.log('Verified task from DB:', verified);

      await this.auditLogService.logAction('CREATE_TASK', saved.id, user);
      return saved;
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }

  async findAll(user: User, orgId?: number): Promise<Task[]> {
    const query = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.organization', 'organization')
      .leftJoinAndSelect('organization.parent', 'parent') // ← ADD THIS LINE
      .leftJoinAndSelect('task.createdBy', 'createdBy');

    // Get userOrgIds once at the start
    const userOrgIds = user.organizations.map((org) => org.id);

    // Apply role-based scoping
    switch (user.role.name) {
      case 'owner':
        // Owners can see all tasks in their org hierarchy
        if (orgId) {
          const orgScope = await this.orgService.getOrgScope(orgId);
          query.andWhere('task.organizationId IN (:...orgScope)', { orgScope });
        } else {
          // If no org specified, show tasks from all user's organizations
          query.andWhere('task.organizationId IN (:...userOrgIds)', {
            userOrgIds,
          });
        }
        break;

      case 'admin':
        // Admins can see all tasks in their specific orgs
        query.andWhere('task.organizationId IN (:...userOrgIds)', {
          userOrgIds,
        });
        break;

      case 'viewer':
        // Viewers can only see their own tasks
        query.andWhere('task.createdById = :userId', { userId: user.id });
        query.andWhere('task.organizationId IN (:...userOrgIds)', {
          userOrgIds,
        });
        break;
    }

    return query.getMany();
  }

  async update(id: number, body: any, user: User) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['createdBy', 'organization'], // Changed from 'owner' to 'createdBy'
    });
    if (!task) throw new NotFoundException('Task not found');

    Object.assign(task, body);
    const saved = await this.taskRepo.save(task);

    // log audit
    await this.auditLogService.logAction('UPDATE_TASK', saved.id, user);

    return saved;
  }

  async remove(id: number, user: User) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['createdBy', 'organization'], // Changed from 'owner' to 'createdBy'
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.taskRepo.remove(task);

    // log audit
    await this.auditLogService.logAction('DELETE_TASK', id, user);

    return { success: true };
  }
}
