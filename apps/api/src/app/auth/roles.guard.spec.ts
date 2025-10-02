import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Test } from '@nestjs/testing';
import { RoleHierarchyService } from '../../../../../libs/auth/src/lib/role-hierarchy.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let roleHierachy: RoleHierarchyService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        {
          provide: RoleHierarchyService,
          useValue: {
            isValidRole: jest
              .fn()
              .mockImplementation((role) =>
                ['owner', 'admin', 'viewer'].includes(role)
              ),
            hasRoleAccess: jest
              .fn()
              .mockImplementation((userRole, requiredRole) => {
                // Mock role inheritance logic
                if (userRole === 'owner') return true;
                if (userRole === 'admin') return requiredRole !== 'owner';
                if (userRole === 'viewer') return requiredRole === 'viewer';
                return false;
              }),
          },
        },
      ],
    }).compile();

    guard = moduleRef.get<RolesGuard>(RolesGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
    roleHierachy = moduleRef.get<RoleHierarchyService>(RoleHierarchyService);
  });

  const mockContext = (roles: string[] = [], userRole = 'viewer') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: { name: userRole } } }), // Add .name to match your actual user structure
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext);

  it('should allow if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = mockContext([], 'admin');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw if user lacks role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = mockContext([], 'viewer');

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow if no roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = mockContext();

    expect(guard.canActivate(ctx)).toBe(true);
  });

  // Add tests for role inheritance
  it('should allow owner to access admin routes (inheritance)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = mockContext([], 'owner');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow admin to access viewer routes (inheritance)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['viewer']);
    const ctx = mockContext([], 'admin');

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
