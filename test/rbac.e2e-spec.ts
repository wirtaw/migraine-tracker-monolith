import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/auth/supabase/supabase.service';
import { Role } from '../src/auth/enums/roles.enum';
import type { Server } from 'http';
import { mockGlobalFetch } from './helper/fetch-mock';

process.env.CLOUDFLARE_WORKER_URL = 'worker-service-url';
process.env.CLOUDFLARE_WORKER_HEADER_KEY = 'worker-service-header';

describe('RBAC + SupabaseAuthGuard E2E', () => {
  let app: INestApplication;
  const userToken = 'valid-user-token';
  const adminToken = 'valid-admin-token';
  const workerKey = 'secure_worker_key';
  const jwtSecret = 'secure_jwt_secret';

  const mockSupabaseService = {
    client: {
      auth: {
        getUser: jest.fn().mockImplementation((token: string) => {
          if (token === userToken) {
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
          if (token === adminToken) {
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
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should allow access to public endpoint without token', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: {
        JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
        JWT_SECRET: jwtSecret,
      },
    });
    const res = await request(app.getHttpServer() as Server)
      .get('/test/public')
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({ message: 'public ok' });
  });

  it('should deny access to private endpoint without token', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: {
        JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
        JWT_SECRET: jwtSecret,
      },
    });
    await request(app.getHttpServer() as Server)
      .get('/test/private')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should allow access to private endpoint with valid user token', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: {
        JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
        JWT_SECRET: jwtSecret,
      },
    });
    const res = await request(app.getHttpServer() as Server)
      .get('/test/private')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({ message: 'private ok' });
  });

  it('should deny access to admin endpoint with user role', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: {
        JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
        JWT_SECRET: jwtSecret,
      },
    });
    await request(app.getHttpServer() as Server)
      .get('/test/admin')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should allow access to admin endpoint with admin role', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      data: {
        JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
        JWT_SECRET: jwtSecret,
      },
    });
    const res = await request(app.getHttpServer() as Server)
      .get('/test/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(HttpStatus.OK);

    expect(res.body).toEqual({ message: 'admin ok' });
  });
});
