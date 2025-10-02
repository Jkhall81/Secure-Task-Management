import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrganizationService } from '../organization/organization.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

// Enhanced mock user factory
const createMockUser = (orgId: number) =>
  ({
    id: 1,
    email: 'test@example.com',
    password: 'hashed',
    role: {
      id: 1,
      name: 'viewer',
      permissions: [],
      users: [],
    },
    organizations: [{ id: orgId, name: 'Test Org' }],
    tasks: [],
  } as unknown as User);

// Enhanced mock repository factory
const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  })),
});

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: jest.Mocked<Repository<Task>>;
  let orgRepo: jest.Mocked<Repository<Organization>>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let orgService: jest.Mocked<OrganizationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useFactory: createMockRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useFactory: createMockRepository,
        },
        {
          provide: AuditLogService,
          useValue: {
            logAction: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OrganizationService,
          useValue: {
            getOrgScope: jest.fn().mockResolvedValue([10]),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
    orgRepo = module.get(getRepositoryToken(Organization));
    auditLogService = module.get(AuditLogService);
    orgService = module.get(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a task, then log audit', async () => {
      const dto = { title: 'Task1', description: 'desc' };
      const user = createMockUser(10);
      const mockOrg = { id: 10, name: 'Test Org' } as Organization;
      const savedTask = {
        id: 123,
        ...dto,
        status: 'pending',
        category: 'work',
        organization: mockOrg,
        createdBy: user,
        createdById: user.id,
      } as Task;

      orgRepo.findOne.mockResolvedValue(mockOrg);
      taskRepo.create.mockReturnValue(savedTask);
      taskRepo.save.mockResolvedValue(savedTask);
      taskRepo.findOne.mockResolvedValue(savedTask); // For verification

      const result = await service.create(dto, user);

      expect(orgRepo.findOne).toHaveBeenCalledWith({
        where: { id: user.organizations[0].id },
      });
      expect(taskRepo.create).toHaveBeenCalledWith({
        title: dto.title,
        description: dto.description,
        status: 'pending',
        category: 'work',
        organization: mockOrg,
        createdBy: user,
        createdById: user.id,
      });
      expect(taskRepo.save).toHaveBeenCalledWith(savedTask);
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'CREATE_TASK',
        savedTask.id,
        user
      );
      expect(result).toEqual(savedTask);
    });

    it('should throw if organization not found', async () => {
      const dto = { title: 'Task1', description: 'desc' };
      const user = createMockUser(10);

      orgRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, user)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findAll', () => {
    it('should return tasks within org scope', async () => {
      const user = createMockUser(10);
      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          organization: { id: 10 },
        },
      ] as Task[];

      // Mock query builder chain
      const mockGetMany = jest.fn().mockResolvedValue(mockTasks);
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: mockGetMany,
      };
      taskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(user);

      expect(taskRepo.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'task.organization',
        'organization'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'task.createdBy',
        'createdBy'
      );
      expect(result).toEqual(mockTasks);
    });
  });

  describe('update', () => {
    it('should update a task if user has org access', async () => {
      const user = createMockUser(10);
      const existingTask = {
        id: 1,
        title: 'Original',
        organization: { id: 10 },
      } as Task;
      const updatedTask = {
        ...existingTask,
        title: 'Updated',
      } as Task;
      const updateDto = { title: 'Updated' };

      taskRepo.findOne.mockResolvedValue(existingTask);
      taskRepo.save.mockResolvedValue(updatedTask);

      const result = await service.update(1, updateDto, user);

      // Update expectation to include createdBy
      expect(taskRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['organization', 'createdBy'], // Updated to match actual service
      });
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated' })
      );
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'UPDATE_TASK',
        1,
        user
      );
      expect(result).toEqual(updatedTask);
    });

    it('should throw if task not found', async () => {
      const user = createMockUser(10);

      taskRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, {}, user)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw if user not allowed', async () => {
      const user = createMockUser(10);
      const updateTaskDto = { title: 'Updated Task' };
      const taskFromDifferentOrg = {
        id: 1,
        title: 'Existing Task',
        organization: { id: 999 }, // Different org ID
      } as Task;

      taskRepo.findOne.mockResolvedValue(taskFromDifferentOrg);

      await expect(service.update(1, updateTaskDto, user)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('remove', () => {
    it('should remove a task if user has org access', async () => {
      const user = createMockUser(10);
      const task = {
        id: 1,
        title: 'Task to delete',
        organization: { id: 10 },
      } as Task;

      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.remove.mockResolvedValue(task as any);

      const result = await service.remove(1, user);

      // Update expectation to include createdBy
      expect(taskRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['organization', 'createdBy'], // Updated to match actual service
      });
      expect(taskRepo.remove).toHaveBeenCalledWith(task);
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'DELETE_TASK',
        1,
        user
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw if task not found', async () => {
      const user = createMockUser(10);

      taskRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1, user)).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not allowed', async () => {
      const user = createMockUser(10);
      const taskFromDifferentOrg = {
        id: 1,
        title: 'Task to delete',
        organization: { id: 999 }, // Different org ID
      } as Task;

      taskRepo.findOne.mockResolvedValue(taskFromDifferentOrg);

      await expect(service.remove(1, user)).rejects.toThrow(ForbiddenException);
    });
  });
});
