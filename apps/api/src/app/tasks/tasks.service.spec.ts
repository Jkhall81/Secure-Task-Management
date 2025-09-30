import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrganizationService } from '../organization/organization.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: jest.Mocked<Repository<Task>>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let orgService: jest.Mocked<OrganizationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockRepo() },
        { provide: AuditLogService, useValue: { logAction: jest.fn() } },
        { provide: OrganizationService, useValue: { getOrgScope: jest.fn() } },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
    auditLogService = module.get(AuditLogService);
    orgService = module.get(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a task, then log audit', async () => {
      const dto = { title: 'Task1', description: 'desc' };
      const user = { id: 1, organization: { id: 10 } } as User;
      const savedTask = { id: 123, ...dto };

      taskRepo.create.mockReturnValue(savedTask as Task);
      taskRepo.save.mockResolvedValue(savedTask as Task);

      const result = await service.create(dto, user);

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining(dto)
      );
      expect(taskRepo.save).toHaveBeenCalledWith(savedTask);
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'CREATE_TASK',
        savedTask.id,
        user
      );
      expect(result).toEqual(savedTask);
    });
  });

  describe('findAll', () => {
    it('should return tasks within org scope', async () => {
      const user = { id: 1, organization: { id: 10 } } as User;
      const mockTasks = [{ id: 1, title: 'T1' }];
      orgService.getOrgScope.mockResolvedValue([10, 11]);
      taskRepo.find.mockResolvedValue(mockTasks as Task[]);

      const result = await service.findAll(user);

      expect(orgService.getOrgScope).toHaveBeenCalledWith(10);
      expect(taskRepo.find).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });
  });

  describe('update', () => {
    it('should update a task if user has org access', async () => {
      const user = { id: 1, organization: { id: 10 } } as User;
      const task = { id: 1, organization: { id: 10 } } as Task;
      taskRepo.findOne.mockResolvedValue(task);
      orgService.getOrgScope.mockResolvedValue([10]);
      taskRepo.save.mockResolvedValue({ ...task, title: 'Updated' } as Task);

      const result = await service.update(1, { title: 'Updated' }, user);

      expect(taskRepo.save).toHaveBeenCalled();
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'UPDATE_TASK',
        1,
        user
      );
      expect(result).toHaveProperty('title', 'Updated');
    });

    it('should throw if task not found', async () => {
      taskRepo.findOne.mockResolvedValue(null);
      await expect(service.update(1, {}, {} as User)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw if user not allowed', async () => {
      const task = { id: 1, organization: { id: 99 } } as Task;
      taskRepo.findOne.mockResolvedValue(task);
      orgService.getOrgScope.mockResolvedValue([10]);
      const user = { id: 1, organization: { id: 10 } } as User;

      await expect(service.update(1, {}, user)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('remove', () => {
    it('should remove a task if user has org access', async () => {
      const user = { id: 1, organization: { id: 10 } } as User;
      const task = { id: 1, organization: { id: 10 } } as Task;
      taskRepo.findOne.mockResolvedValue(task);
      orgService.getOrgScope.mockResolvedValue([10]);

      const result = await service.remove(1, user);

      expect(taskRepo.remove).toHaveBeenCalledWith(task);
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'DELETE_TASK',
        1,
        user
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw if task not found', async () => {
      taskRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(1, {} as User)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw if user not allowed', async () => {
      const task = { id: 1, organization: { id: 99 } } as Task;
      taskRepo.findOne.mockResolvedValue(task);
      orgService.getOrgScope.mockResolvedValue([10]);
      const user = { id: 1, organization: { id: 10 } } as User;

      await expect(service.remove(1, user)).rejects.toThrow(ForbiddenException);
    });
  });
});
