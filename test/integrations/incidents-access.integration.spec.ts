import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import { CustomJwtService } from '../../src/auth/jwt.service';
import { Role } from '../../src/auth/enums/roles.enum';
import { AuthResponse } from '../../src/auth/interfaces/auth.user.interface';
import { CreateIncidentDto } from '../../src/incidents/dto/create-incident.dto';
import { IncidentTypeEnum } from '../../src/incidents/enums/incident-type.enum';
import { TriggerTypeEnum } from '../../src/triggers/enums/trigger-type.enum';
import { type User as SupabaseUser, type Session } from '@supabase/supabase-js';
import { SupabaseService } from '../../src/auth/supabase/supabase.service';

describe('Incidents Access Flow (integration)', () => {
  let app: INestApplication;
  let jwtService: CustomJwtService;
  let connection: Connection;
  const email = 'accessUser@example.com';
  const password = 'StrongPass123!';
  let token: string;
  let createDto: CreateIncidentDto;
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

  beforeAll(async () => {
    createDto = {
      userId: 'testUser',
      type: IncidentTypeEnum.AURA_EPISODE,
      startTime: new Date(),
      durationHours: 1,
      notes: 'Test notes',
      triggers: [TriggerTypeEnum.STRESS, TriggerTypeEnum.LACK_OF_SLEEP],
      datetimeAt: new Date(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<CustomJwtService>(CustomJwtService);
    connection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it('should register and login user to get token', async () => {
    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        longitude: '1',
        latitude: '1',
        birthDate: '2000-01-01',
        email,
        password,
      })
      .expect(HttpStatus.CREATED);

    const loginRes = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email, password })
      .expect(HttpStatus.OK);

    const body = loginRes.body as AuthResponse;

    token = body.token;
    expect(token).toBeDefined();
  });

  it('should allow access to POST /incidents with valid token and USER role', async () => {
    const res = await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send(createDto)
      .expect(HttpStatus.CREATED);

    expect(res.body).toHaveProperty('type', IncidentTypeEnum.AURA_EPISODE);
    expect(res.body).toHaveProperty('notes', createDto.notes);
  });

  it('should reject access to POST /incidents without token', async () => {
    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .send(createDto)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should reject access to POST /incidents with insufficient role', async () => {
    const guestToken = await jwtService.signPayload(
      {
        userId: 'guest-id',
        email: 'guest@example.com',
        key: 'fakeKey',
        role: Role.GUEST,
      },
      '6 h',
    );

    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${guestToken}`)
      .send(createDto)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should reject access to POST /incidents with expired token', async () => {
    const expiredToken = await jwtService.signPayload(
      {
        userId: 'expired-id',
        email: 'expired@example.com',
        key: 'expiredKey',
        role: Role.USER,
      },
      '1 s',
    );

    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send(createDto)
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
