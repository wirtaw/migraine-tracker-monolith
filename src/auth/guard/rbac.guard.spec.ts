import { RbacGuard } from './rbac.guard';
import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Role } from '../enums/roles.enum';
import { Permission } from '../enums/permissions.enum';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;
  let supabaseService: SupabaseService;

  beforeEach(() => {
    reflector = new Reflector();
    supabaseService = {
      client: {
        auth: {
          getUser: jest.fn(),
        },
      },
    } as unknown as SupabaseService;

    guard = new RbacGuard(reflector, supabaseService);
  });

  const createMockContext = (token?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: token ? `Bearer ${token}` : undefined,
          },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('should allow access to public endpoint', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === 'isPublic' ? true : undefined));

    const context = createMockContext();
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if token is missing', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if Supabase returns error', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    supabaseService.client.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const context = createMockContext('invalid-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should allow access with valid role and permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'roles') return [Role.ADMIN];
      if (key === 'permissions') return [Permission.MANAGE_USERS];
      return false;
    });

    supabaseService.client.auth.getUser = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          user_metadata: {
            role: Role.ADMIN,
            permissions: [Permission.MANAGE_USERS],
          },
        },
      },
      error: null,
    });

    const context = createMockContext('admin-token');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if role is insufficient', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) =>
        key === 'roles' ? [Role.ADMIN] : undefined,
      );

    supabaseService.client.auth.getUser = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          user_metadata: {
            role: Role.USER,
            permissions: [],
          },
        },
      },
      error: null,
    });

    const context = createMockContext('user-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should allow access with valid USER role and permission if metadata exist', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'roles') return [Role.USER];
      if (key === 'permissions') return [];
      return false;
    });

    supabaseService.client.auth.getUser = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          user_metadata: {},
        },
      },
      error: null,
    });

    const context = createMockContext('user-token');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if permissions are insufficient', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) =>
        key === 'permissions' ? [Permission.MANAGE_USERS] : undefined,
      );

    supabaseService.client.auth.getUser = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          user_metadata: {
            role: Role.ADMIN,
            permissions: [],
          },
        },
      },
      error: null,
    });

    const context = createMockContext('admin-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
