import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Permission } from '../enums/permissions.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('should allow access if no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { permissions: [] } }),
      }),
      getHandler: () => {},
      getClass: () => {},
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.READ_MIGRAINE, Permission.WRITE_MIGRAINE]);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: [Permission.READ_MIGRAINE, Permission.WRITE_MIGRAINE],
          },
        }),
      }),
      getHandler: () => {},
      getClass: () => {},
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.MANAGE_USERS]);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            permissions: [Permission.READ_MIGRAINE],
          },
        }),
      }),
      getHandler: () => {},
      getClass: () => {},
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });
});
