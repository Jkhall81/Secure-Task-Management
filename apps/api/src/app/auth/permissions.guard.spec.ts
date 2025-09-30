import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const mockContext = (permissions: string[] = []) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role: {
              permissions: permissions.map((p) => ({ name: p })),
            },
          },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext);

  it('should allow if user has required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CREATE_TASK']);
    const ctx = mockContext(['CREATE_TASK', 'VIEW_TASK']);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw if user lacks required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['DELETE_TASK']);
    const ctx = mockContext(['VIEW_TASK']);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow if no permissions metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = mockContext();

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
