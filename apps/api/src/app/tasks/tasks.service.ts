import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly auditLogService: AuditLogService,
    private readonly orgService: OrganizationService
  ) {}

  async create(body: any, user: User) {
    const task = this.taskRepo.create({
      title: body.title,
      description: body.description,
      status: body.status || 'pending',
      organization: user.organization, // scope to same org
      owner: user, // relation back to user
    });
    const saved = await this.taskRepo.save(task);

    // log audit
    await this.auditLogService.logAction('CREATE_TASK', saved.id, user);

    return saved;
  }

  async findAll(user: User) {
    // Get current org + children
    const orgIds = await this.orgService.getOrgScope(user.organization.id);

    return this.taskRepo.find({
      where: { organization: { id: In(orgIds) } },
      relations: ['owner', 'organization'],
    });
  }

  async update(id: number, body: any, user: User) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['owner', 'organization'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const orgIds = await this.orgService.getOrgScope(user.organization.id);
    if (!orgIds.includes(task.organization.id)) {
      throw new ForbiddenException('Not allowed');
    }

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

    const orgIds = await this.orgService.getOrgScope(user.organization.id);
    if (!orgIds.includes(task.organization.id)) {
      throw new ForbiddenException('Not allowed');
    }

    await this.taskRepo.remove(task);

    // log audit
    await this.auditLogService.logAction('DELETE_TASK', id, user);

    return { success: true };
  }
}
