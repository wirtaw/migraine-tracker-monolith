import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/auth/supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../src/auth/enums/roles.enum';

process.env.JWT_SECRET = 'test-secret-key';

describe('RBAC + SupabaseAuthGuard E2E', () => {
  let app: INestApplication;

  // Mock SupabaseService z różnymi scenariuszami tokenów
  const mockSupabaseService = {
    client: {
      auth: {
        getUser: jest.fn().mockImplementation((token: string) => {
          if (token === 'valid-user-token') {
            return Promise.resolve({
              data: {
                user: {
                  id: 'user-id',
                  email: 'user@example.com',
                  user_metadata: { role: Role.USER },
                },
              },
              error: null,
            });
          }
          if (token === 'valid-admin-token') {
            return Promise.resolve({
              data: {
                user: {
                  id: 'admin-id',
                  email: 'admin@example.com',
                  user_metadata: { role: Role.ADMIN },
                },
              },
              error: null,
            });
          }
          return Promise.resolve({
            data: { user: null },
            error: { message: 'Invalid token' },
          });
        }),
      },
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (k: string) =>
          k === 'JWT_SECRET' ? 'test-secret-key' : undefined,
      })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow access to public endpoint without token', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/public')
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({ message: 'public ok' });
  });

  it('should deny access to private endpoint without token', async () => {
    await request(app.getHttpServer())
      .get('/test/private')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should allow access to private endpoint with valid user token', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/private')
      .set('Authorization', 'Bearer valid-user-token')
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({ message: 'private ok' });
  });

  it('should deny access to admin endpoint with user role', async () => {
    await request(app.getHttpServer())
      .get('/test/admin')
      .set('Authorization', 'Bearer valid-user-token')
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should allow access to admin endpoint with admin role', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/admin')
      .set('Authorization', 'Bearer valid-admin-token')
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({ message: 'admin ok' });
  });
});
