import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call AuthService.register with dto', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'pw123456',
        roleName: 'viewer',
        orgId: 1,
      };

      const mockUser = { id: 1, email: dto.email } as User;
      (service.register as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should call AuthService.login with email and password', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'pw123456' };

      const mockResult = { access_token: 'jwt-token' };
      (service.login as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getProfile', () => {
    it('should return the user from request', async () => {
      const mockReq = { user: { id: 1, email: 'test@example.com' } };

      const result = await controller.getProfile(mockReq);

      expect(result).toEqual(mockReq.user);
    });
  });
});
