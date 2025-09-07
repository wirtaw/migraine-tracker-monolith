// src/auth/supabase.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from './supabase.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

import Supabase from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => {
  const actual: typeof Supabase = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn<typeof Supabase.createClient, []>(),
  };
});

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockClient: Supabase.SupabaseClient;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const mockAuth = {
      getUser: jest.fn(),
    };

    mockClient = {
      auth: mockAuth,
    } as unknown as Supabase.SupabaseClient;

    (Supabase.createClient as jest.Mock).mockReturnValue(mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: () => ({
              supaBaseUrl: 'https://fake.supabase.co',
              supaBaseAnonKey: 'fake-anon-key',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  describe('getUser', () => {
    it('should return user data for a valid token', async () => {
      (mockClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.getUser('valid-token');
      expect(result).toEqual(mockUser);
      expect(mockClient.auth['getUser']).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for missing token', async () => {
      await expect(service.getUser('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (mockClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid token' },
      });

      await expect(service.getUser('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not returned', async () => {
      (mockClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.getUser('no-user-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
