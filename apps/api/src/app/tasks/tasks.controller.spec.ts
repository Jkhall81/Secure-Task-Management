import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call TasksService.create with dto and user', async () => {
      const dto: CreateTaskDto = { title: 'Test task', description: 'desc' };
      const user = { id: 1, email: 'user@test.com' };
      const mockResult = { id: 1, ...dto };

      (service.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.create(dto, { user });

      expect(service.create).toHaveBeenCalledWith(dto, user);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should call TasksService.findAll with user', async () => {
      const user = { id: 1 };
      const mockResult = [{ id: 1, title: 'Task' }];
      (service.findAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.findAll({ user });

      expect(service.findAll).toHaveBeenCalledWith(user, undefined);
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should call TasksService.update with id, dto, and user', async () => {
      const params = { id: 1 };
      const dto: UpdateTaskDto = { title: 'Updated' };
      const user = { id: 1 };
      const mockResult = { id: 1, title: 'Updated' };
      (service.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.update(params, dto, { user });

      expect(service.update).toHaveBeenCalledWith(params.id, dto, user);
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should call TasksService.remove with id and user', async () => {
      const params = { id: 1 };
      const user = { id: 1 };
      const mockResult = { success: true };
      (service.remove as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.remove(params, { user });

      expect(service.remove).toHaveBeenCalledWith(params.id, user);
      expect(result).toEqual(mockResult);
    });
  });
});
