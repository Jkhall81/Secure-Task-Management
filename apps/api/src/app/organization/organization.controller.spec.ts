import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let service: OrganizationService;

  const mockOrgService = {
    create: jest.fn(),
    findAllWithChildren: jest.fn(),
    addUserToOrg: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [{ provide: OrganizationService, useValue: mockOrgService }],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call OrganizationService.create with dto data', async () => {
      const dto: CreateOrganizationDto = { name: 'Org1', parentId: 5 };
      const mockResult = { id: 1, name: dto.name };

      (service.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto.name, dto.parentId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all orgs with children', async () => {
      const mockResult = [{ id: 1, name: 'Org1', children: [] }];
      (service.findAllWithChildren as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.findAll();

      expect(service.findAllWithChildren).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('addUser', () => {
    it('should call OrganizationService.addUserToOrg with ids', async () => {
      const mockResult = { success: true };
      (service.addUserToOrg as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.addUser(1, 2);

      expect(service.addUserToOrg).toHaveBeenCalledWith(2, 1); // note: (userId, orgId)
      expect(result).toEqual(mockResult);
    });
  });
});
