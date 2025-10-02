import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';
import { OrganizationService } from '../organization/organization.service';

// Enhanced mock factory with all required properties
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

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

// Enhanced Mock OrganizationService with ALL required methods
const mockOrganizationService = {
  // Add the missing create method that your AuthService is calling
  create: jest.fn().mockResolvedValue({ id: 1, name: 'Test Org' }),

  // Keep existing methods
  findDefaultOrganization: jest
    .fn()
    .mockResolvedValue({ id: 1, name: 'Test Org' }),
  addUserToOrg: jest.fn().mockResolvedValue(undefined),
  getOrgScope: jest.fn(),
  findOne: jest.fn(),
};

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let orgRepo: jest.Mocked<Repository<Organization>>;
  let jwtService: JwtService;
  let organizationService: jest.Mocked<OrganizationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepo() },
        { provide: getRepositoryToken(Role), useValue: mockRepo() },
        { provide: getRepositoryToken(Organization), useValue: mockRepo() },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt'),
            signAsync: jest.fn().mockResolvedValue('fake-jwt'),
          },
        },
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    roleRepo = module.get(getRepositoryToken(Role));
    orgRepo = module.get(getRepositoryToken(Organization));
    jwtService = module.get(JwtService);
    organizationService = module.get(OrganizationService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('creates a user if email is free', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Create the expected user object with all properties
      const expectedUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        role: {
          id: 1,
          name: 'viewer',
          permissions: [],
          users: [],
        },
        organizations: [{ id: 1, name: 'Test Org' }],
        tasks: [],
      };

      // Mock the repository responses
      userRepo.findOne.mockResolvedValue(null); // No existing user
      userRepo.create.mockReturnValue(expectedUser as any);
      userRepo.save.mockResolvedValue(expectedUser as any);

      // Mock bcrypt hash
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

      // Mock role lookup
      roleRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'viewer',
        permissions: [],
        users: [],
      } as Role);

      // Mock organization creation - this is what was missing
      organizationService.create.mockResolvedValue({
        id: 1,
        name: 'Test Org',
      } as Organization);

      const result = await service.register(registerDto);

      // Verify the calls
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepo.save).toHaveBeenCalledWith(expectedUser);
      expect(organizationService.create).toHaveBeenCalled(); // Verify organization was created
      expect(result).toEqual(expectedUser);
    });

    it('throws if email already exists', async () => {
      const existingUser = createMockUser(1);
      userRepo.findOne.mockResolvedValue(existingUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('returns JWT if credentials valid', async () => {
      const user = createMockUser(1);
      user.password = await bcrypt.hash('password123', 10);

      userRepo.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login('test@example.com', 'password123');

      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'fake-jwt');
      expect(result.user).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'viewer',
        organization: 'Test Org',
      });
    });

    it('throws if credentials invalid', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login('x@y.com', 'pw')).rejects.toThrow();
    });

    it('throws if password is incorrect', async () => {
      const user = createMockUser(1);
      user.password = await bcrypt.hash('correct-password', 10);

      userRepo.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login('test@example.com', 'wrong-password')
      ).rejects.toThrow();
    });
  });
});
