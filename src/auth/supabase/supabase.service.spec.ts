// src/auth/supabase.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

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
  let module: TestingModule;

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

    module = await Test.createTestingModule({
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

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('getUser', () => {
    it('should return user data for a valid token', async () => {
      (mockClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.getUser('valid-token');
      expect(result).toEqual({
        data: { user: mockUser },
        error: null,
      });
      expect(mockClient.auth['getUser']).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for missing token', async () => {
      await expect(service.getUser('')).rejects.toThrow(UnauthorizedException);
    });
  });
});
