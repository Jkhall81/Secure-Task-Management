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
      owner: user,
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

  async findAll(user: User, orgId?: number) {
    // Use specific orgId if provided, otherwise user's current org
    const targetOrgId = orgId || user.organizations?.[0]?.id;

    return this.taskRepo.find({
      where: { organization: { id: targetOrgId } },
      relations: ['owner', 'organization'],
    });
  }

  async update(id: number, body: any, user: User) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['owner', 'organization'],
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
      relations: ['owner', 'organization'],
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.taskRepo.remove(task);

    // log audit
    await this.auditLogService.logAction('DELETE_TASK', id, user);

    return { success: true };
  }
}
