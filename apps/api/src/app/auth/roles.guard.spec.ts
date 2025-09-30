import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContext = (roles: string[] = [], userRole = 'viewer') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole } }),
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
});
