import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { OrganizationService } from '../organization/organization.service';

// Slick mock factory
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

// Utility: mock a TypeORM repo
const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditRepo: jest.Mocked<Repository<AuditLog>>;
  let orgService: Partial<OrganizationService>;

  beforeEach(async () => {
    orgService = { getOrgScope: jest.fn().mockResolvedValue([1, 2]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: getRepositoryToken(AuditLog), useValue: mockRepo() },
        { provide: OrganizationService, useValue: orgService },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditRepo = module.get(getRepositoryToken(AuditLog));
  });

  it('should log an action', async () => {
    const user = createMockUser(1);

    const mockLog = { id: 123, action: 'CREATE_TASK' } as AuditLog;
    auditRepo.create.mockReturnValue(mockLog);
    auditRepo.save.mockResolvedValue(mockLog);

    const result = await service.logAction('CREATE_TASK', 42, user);

    expect(auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_TASK',
        targetId: 42,
        user,
        organization: user.organizations[0], // Fix: use organizations[0] instead of organization
      })
    );
    expect(auditRepo.save).toHaveBeenCalledWith(mockLog);
    expect(result).toBeUndefined(); // logAction doesn't return anything
  });

  it('should find all logs in org scope', async () => {
    const logs = [{ id: 1 }, { id: 2 }] as AuditLog[];
    auditRepo.find.mockResolvedValue(logs);

    const result = await service.findAllForOrg(1);

    expect(orgService.getOrgScope).toHaveBeenCalledWith(1);
    expect(auditRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organization: { id: expect.any(Object) } },
      })
    );
    expect(result).toEqual(logs);
  });

  it('should find logs by user in org scope', async () => {
    const logs = [{ id: 5 }] as AuditLog[];
    auditRepo.find.mockResolvedValue(logs);

    const result = await service.findByUserInOrg(7, 1);

    expect(orgService.getOrgScope).toHaveBeenCalledWith(1);
    expect(auditRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          user: { id: 7 },
          organization: { id: expect.any(Object) },
        },
      })
    );
    expect(result).toEqual(logs);
  });
});
