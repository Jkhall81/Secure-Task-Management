import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { RoleHierarchyService } from '../../../../../libs/auth/src/lib/role-hierarchy.service';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let service: AuditLogService;

  const mockAuditLogService = {
    findAllForOrg: jest.fn(),
    findByUserInOrg: jest.fn(),
  };

  const mockRoleHierarchyService = {
    isValidRole: jest.fn().mockReturnValue(true),
    hasRoleAccess: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: RoleHierarchyService, useValue: mockRoleHierarchyService },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    service = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return logs for org', async () => {
    const req = { user: { organization: { id: 1 } } };
    const logs = [{ id: 1 }, { id: 2 }];
    mockAuditLogService.findAllForOrg.mockResolvedValue(logs);

    const result = await controller.findAll(req);

    expect(service.findAllForOrg).toHaveBeenCalledWith(1);
    expect(result).toEqual(logs);
  });

  it('should return logs for a user in org', async () => {
    const req = { user: { organization: { id: 1 } } };
    const logs = [{ id: 3 }];
    mockAuditLogService.findByUserInOrg.mockResolvedValue(logs);

    const result = await controller.findByUser(7, req);

    expect(service.findByUserInOrg).toHaveBeenCalledWith(7, 1);
    expect(result).toEqual(logs);
  });
});
