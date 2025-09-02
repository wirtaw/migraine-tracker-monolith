import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import { SupabaseService } from '../src/auth/supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

process.env.JWT_SECRET = 'test-secret-key';

interface LoginResponse {
  message: string;
  access_token: string;
  user: { email: string; userId: string };
}

interface SupabaseSignUpResponse {
  data: {
    user: {
      id: string;
      email: string;
      userId: string;
    };
  };
  error: null;
}

interface SupabaseSignInWithPasswordResponse extends SupabaseSignUpResponse {
  data: {
    user: {
      id: string;
      email: string;
      userId: string;
    };
    session: {
      access_token: string;
    };
  };
  error: null;
}

describe('Auth E2E', () => {
  let app: INestApplication;
  let connection: Connection;
  let userModel: Model<UserDocument>;
  const email = 'mock@example.com';

  // Mock SupabaseService
  const mockSupabaseService = {
    client: {
      auth: {
        signUp: jest.fn().mockImplementation(() => {
          const response: SupabaseSignUpResponse = {
            data: {
              user: { id: 'mock-supabase-id', email, userId: 'userId-001' },
            },
            error: null,
          };

          return Promise.resolve(response);
        }),
        signInWithPassword: jest.fn().mockImplementation(() => {
          const response: SupabaseSignInWithPasswordResponse = {
            data: {
              user: { id: 'mock-supabase-id', email, userId: 'userId-002' },
              session: { access_token: 'mock-access-token' },
            },
            error: null,
          };

          return Promise.resolve(response);
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
    it('should register a new user and store encryptedSymmetricKey in correct format', async () => {
      const password = 'StrongPass123!';

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          longitude: '1',
          latitude: '1',
          birthDate: '2000-01-01',
          email,
          password,
        })
        .expect(HttpStatus.CREATED);

      const body = res.body as LoginResponse;
      expect(body).toHaveProperty('message', 'User successfully registered.');
      expect(body.user).toHaveProperty('email', email);
      expect(body).toHaveProperty('token');

      const userInDb = await userModel
        .findOne({ userId: body.user.userId })
        .lean();
      expect(userInDb).toBeTruthy();
      expect(userInDb?.encryptedSymmetricKey).toMatch(
        /^[a-f0-9]{32}:[a-f0-9]+:[a-f0-9]{32}$/,
      );
    });
  });

  describe('POST /auth/login', () => {
    it('should login an existing user', async () => {
      const password = 'StrongPass123!';

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.OK);

      const body = res.body as LoginResponse;
      expect(body).toHaveProperty('message', 'Successfully logged in.');
      expect(body).toHaveProperty('access_token', 'mock-access-token');
      expect(body.user).toHaveProperty('email', email);
    });
  });
});
