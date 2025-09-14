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
import { CustomJwtService } from '../jwt.service';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;
  let supabaseService: SupabaseService;
  let jwtService: CustomJwtService;

  const mockJwtService = {
    verifyToken: jest.fn(),
  };

  beforeEach(() => {
    reflector = new Reflector();
    supabaseService = {
      client: {
        auth: {
          getUser: jest.fn(),
        },
      },
    } as unknown as SupabaseService;
    jwtService = mockJwtService as unknown as CustomJwtService;

    guard = new RbacGuard(reflector, supabaseService, jwtService);
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

  it('should allow access with valid JWT token and session data', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    mockJwtService.verifyToken.mockResolvedValue({
      userId: 'jwt-user-id',
      email: 'jwt@example.com',
      key: 'encryptedKey123',
      expire_in: Math.floor(Date.now() / 1000) + 60,
    });

    const context = createMockContext('valid-jwt-token');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if JWT token is expired', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    mockJwtService.verifyToken.mockResolvedValue({
      userId: 'expired-user-id',
      email: 'expired@example.com',
      key: 'expiredKey',
      expire_in: Math.floor(Date.now() / 1000) - 10,
    });

    const context = createMockContext('expired-jwt-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should fallback to Supabase if JWT verification fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    mockJwtService.verifyToken.mockRejectedValue(new Error('Invalid JWT'));

    supabaseService.client.auth.getUser = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'supabase-id',
          email: 'supabase@example.com',
          user_metadata: {
            role: Role.USER,
            permissions: [],
          },
        },
      },
      error: null,
    });

    const context = createMockContext('fallback-token');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow access if JWT token has no expire_in field', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    mockJwtService.verifyToken.mockResolvedValue({
      userId: 'no-exp-user-id',
      email: 'no-exp@example.com',
      key: 'no-exp-key',
    });

    const context = createMockContext('no-exp-token');
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
    mockJwtService.verifyToken.mockRejectedValue(new Error('Invalid JWT'));
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
    mockJwtService.verifyToken.mockRejectedValue(new Error('Invalid JWT'));

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
    mockJwtService.verifyToken.mockRejectedValue(new Error('Invalid JWT'));

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
      if (key === 'roles') return [Role.GUEST];
      if (key === 'permissions') return [];
      return false;
    });
    mockJwtService.verifyToken.mockRejectedValue(new Error('Invalid JWT'));

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
    mockJwtService.verifyToken.mockRejectedValue(new Error('Invalid JWT'));

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
