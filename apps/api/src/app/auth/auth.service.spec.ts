import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '../entities/role.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let orgRepo: jest.Mocked<Repository<Organization>>;
  let jwtService: JwtService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    roleRepo = module.get(getRepositoryToken(Role));
    orgRepo = module.get(getRepositoryToken(Organization));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('creates a user if email is free', async () => {
      userRepo.findOne.mockResolvedValue(null); // no existing user
      const dto = {
        email: 'a@b.com',
        password: 'pw',
        orgId: 1,
        roleName: 'viewer',
      };
      const org = { id: 1 } as Organization;
      const role = { id: 2, name: 'viewer' } as Role;
      orgRepo.findOne.mockResolvedValue(org);
      roleRepo.findOne.mockResolvedValue(role);

      const user = { id: 123, email: dto.email } as User;
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);

      const result = await service.register(dto);

      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('throws if email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1 } as User);

      await expect(
        service.register({
          email: 'a@b.com',
          password: 'pw',
          orgId: 1,
          roleName: 'viewer',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('returns JWT if credentials valid', async () => {
      const user = {
        id: 1,
        email: 'a@b.com',
        password: await bcrypt.hash('pw', 10),
        role: { id: 2, name: 'viewer' } as Role,
        organization: { id: 1, name: 'Org1' } as Organization,
      } as User;

      userRepo.findOne.mockResolvedValue(user);

      const result = await service.login('a@b.com', 'pw');
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'fake-jwt');
      expect(result.user).toEqual({
        id: 1,
        email: 'a@b.com',
        role: 'viewer',
        organization: 'Org1',
      });
    });

    it('throws if credentials invalid', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login('x@y.com', 'pw')).rejects.toThrow();
    });
  });
});
