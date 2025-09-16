import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HttpService } from '@nestjs/axios';
import { AppModule } from '../src/app.module';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import { SupabaseService } from '../src/auth/supabase/supabase.service';
import type { Server } from 'http';
import type { AuthResponse } from '../src/auth/interfaces/auth.user.interface';
import { type User as SupabaseUser, type Session } from '@supabase/supabase-js';
import { Role } from '../src/auth/enums/roles.enum';
import { of } from 'rxjs';

process.env.CLOUDFLARE_WORKER_URL = 'worker-service-url';
process.env.CLOUDFLARE_WORKER_HEADER_KEY = 'worker-service-header';

describe('Auth E2E', () => {
  let app: INestApplication;
  let connection: Connection;
  let userModel: Model<UserDocument>;
  const email = 'mock@example.com';
  const user: SupabaseUser = {
    id: 'mock-supabase-id',
    email,
    app_metadata: {},
    user_metadata: {},
    aud: '',
    created_at: new Date().toLocaleDateString(),
  };
  const access_token = 'test';
  const refresh_token = 'test';
  const token_type = '';
  const session: Session = {
    access_token,
    refresh_token,
    expires_in: 100,
    token_type,
    user,
  };
  const singInUserId = 'userId-0001';
  const workerKey = 'secure_worker_key';
  const jwtSecret = 'secure_jwt_secret';

  // Mock SupabaseService
  const mockSupabaseService = {
    client: {
      auth: {
        signUp: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              user: { ...user, id: singInUserId },
            },
            error: null,
          });
        }),
        signInWithPassword: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              user: { ...user, id: singInUserId },
              session,
            },
            error: null,
          });
        }),
      },
    },
  };

  const mockHttpService = {
    get: jest.fn().mockReturnValue(
      of({
        data: {
          JWT_SYMMETRIC_KEY_ENCRYPTION_KEY: workerKey,
          JWT_SECRET: jwtSecret,
        },
      }),
    ),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name),
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  describe('POST /auth/register', () => {
    afterEach(async () => {
      if (connection?.db) {
        const collections = await connection.db.collections();
        for (const collection of collections) {
          await collection.deleteMany({});
        }
      }
    });
    it('should register a new user and store encryptedSymmetricKey in correct format', async () => {
      const password = 'StrongPass123!';

      const res = await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          longitude: '1',
          latitude: '1',
          birthDate: '2000-01-01',
          email,
          password,
        })
        .expect(HttpStatus.CREATED);

      const body = res.body as AuthResponse;
      expect(body).toHaveProperty('message', 'User successfully registered.');
      expect(body.user).toHaveProperty('email', email);
      expect(body).toHaveProperty('token');

      const userInDb = await userModel
        .findOne({ supabaseId: singInUserId })
        .lean();
      expect(userInDb).toBeTruthy();
      expect(userInDb?.encryptedSymmetricKey).toMatch(
        /^[a-f0-9]{32}:[a-f0-9]+:[a-f0-9]{32}$/,
      );
    });
  });

  describe('POST /auth/login', () => {
    afterEach(async () => {
      if (connection?.db) {
        const collections = await connection.db.collections();
        for (const collection of collections) {
          await collection.deleteMany({});
        }
      }
    });
    it('should register and then login an existing user', async () => {
      const password = 'StrongPass123!';

      const registerRes = await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          longitude: '1',
          latitude: '1',
          birthDate: '2000-01-01',
          email,
          password,
        })
        .expect(HttpStatus.CREATED);

      const registerBody = registerRes.body as AuthResponse;
      const registeredUser = registerBody.user;
      expect(registeredUser).toHaveProperty('userId');
      expect(registeredUser).toHaveProperty('email', email);

      const loginRes = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);

      const body = loginRes.body as AuthResponse;

      expect(body).toHaveProperty('message', 'Successfully logged in.');
      expect(body).toHaveProperty('token');
      expect(body.user).toEqual({
        userId: singInUserId,
        email,
        role: Role.GUEST,
      });

      const userInDb = await userModel
        .findOne({ supabaseId: singInUserId })
        .lean();
      expect(userInDb).toBeTruthy();
      expect(userInDb?.encryptedSymmetricKey).toMatch(
        /^[a-f0-9]{32}:[a-f0-9]+:[a-f0-9]{32}$/,
      );
    });

    it('should register and then login empty database', async () => {
      const password = 'StrongPass123!';
      const email = 'login-test@example.com';

      await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
