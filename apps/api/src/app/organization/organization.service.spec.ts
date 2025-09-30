import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationService } from './organization.service';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('OrganizationService', () => {
  let service: OrganizationService;
  let orgRepo: jest.Mocked<Repository<Organization>>;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: getRepositoryToken(Organization), useValue: mockRepo() },
        { provide: getRepositoryToken(User), useValue: mockRepo() },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    orgRepo = module.get(getRepositoryToken(Organization));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
