import crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'node:http';
import { Connection, Model } from 'mongoose';
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../../src/app.module';
import { JwtService } from '../../src/auth/jwt.service';
import { Role } from '../../src/auth/enums/roles.enum';
import { AuthResponse } from '../../src/auth/interfaces/auth.user.interface';
import { CreateIncidentDto } from '../../src/incidents/dto/create-incident.dto';
import { IncidentTypeEnum } from '../../src/incidents/enums/incident-type.enum';
import { TriggerTypeEnum } from '../../src/triggers/enums/trigger-type.enum';
import { type User as SupabaseUser, type Session } from '@supabase/supabase-js';
import { SupabaseService } from '../../src/auth/supabase/supabase.service';
import {
  Incident,
  IncidentDocument,
} from '../../src/incidents/schemas/incident.schema';
import { IIncident } from '../../src/incidents/interfaces/incident.interface';
import { isObjectIdOrString } from '../helper/index';

describe('Incidents Access Flow (integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let connection: Connection;
  let incidentModel: Model<IncidentDocument>;
  let mockHttpService;
  const email = 'accessUser@example.com';
  const password = 'StrongPass123!';
  let token: string;
  let incidentId: string;
  const user: SupabaseUser = {
    id: 'mock-supabase-id',
    email,
    app_metadata: {},
    user_metadata: { role: Role.USER },
    aud: '',
    created_at: new Date().toLocaleDateString(),
  };
  const access_token = 'test';
  const refresh_token = 'test';
  const token_type = 'bearer';
  const session: Session = {
    access_token,
    refresh_token,
    expires_in: 100,
    token_type,
    user,
  };
  const singInUserId = 'userId-0001';
  const triggersCreate: TriggerTypeEnum[] = [
    TriggerTypeEnum.STRESS,
    TriggerTypeEnum.LACK_OF_SLEEP,
  ];

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
    mockHttpService = {
      get: jest.fn().mockReturnValue(
        of({
          data: {
            JWT_SYMMETRIC_KEY_ENCRYPTION_KEY:
              '0123456789abcdef0123456789abcdef',
            JWT_SECRET: 'mocked_jwt_secret',
          },
        }),
      ),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    connection = moduleFixture.get<Connection>(getConnectionToken());
    incidentModel = moduleFixture.get<Model<IncidentDocument>>(
      getModelToken(Incident.name),
    );
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
    const incidentStartDateTime = '2023-01-01T10:00:00.000Z';
    const incidentDateTime = '2023-01-01T12:00:00.000Z';
    const createDto: CreateIncidentDto = {
      userId: singInUserId,
      type: IncidentTypeEnum.MIGRAINE_ATTACK,
      startTime: incidentStartDateTime,
      durationHours: 2,
      notes: 'Started after stress',
      triggers: triggersCreate,
      datetimeAt: incidentDateTime,
    };
    const res = await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send(createDto)
      .expect(HttpStatus.CREATED);

    const incidentInDb = await incidentModel
      .findOne({ userId: createDto.userId })
      .lean<IncidentDocument>();

    const resBody = res.body as IIncident;

    incidentId = resBody?.id;

    expect(incidentInDb).toBeTruthy();
    expect(isObjectIdOrString(incidentInDb?._id)).toBeTruthy();
    //expect(resBody?.id).toEqual(incidentInDb?._id.toString());
    expect(resBody).toHaveProperty('type', IncidentTypeEnum.MIGRAINE_ATTACK);
    expect(resBody).toHaveProperty('durationHours', 2);
    expect(resBody).toHaveProperty('startTime', incidentStartDateTime);
    expect(resBody).toHaveProperty('notes', createDto.notes);
  });

  it('should reject access to POST /incidents without token', async () => {
    const incidentStartDateTime = '2023-01-01T10:00:00.000Z';
    const incidentDateTime = '2023-01-01T12:00:00.000Z';
    const createDto: CreateIncidentDto = {
      userId: singInUserId,
      type: IncidentTypeEnum.MIGRAINE_ATTACK,
      startTime: incidentStartDateTime,
      durationHours: 2,
      notes: 'Started after stress',
      triggers: triggersCreate,
      datetimeAt: incidentDateTime,
    };
    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .send(createDto)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should reject access to POST /incidents with insufficient role', async () => {
    const incidentStartDateTime = '2023-01-01T10:00:00.000Z';
    const incidentDateTime = '2023-01-01T12:00:00.000Z';
    const createDto: CreateIncidentDto = {
      userId: singInUserId,
      type: IncidentTypeEnum.MIGRAINE_ATTACK,
      startTime: incidentStartDateTime,
      durationHours: 2,
      notes: 'Started after stress',
      triggers: triggersCreate,
      datetimeAt: incidentDateTime,
    };
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
    const incidentStartDateTime = '2023-01-01T10:00:00.000Z';
    const incidentDateTime = '2023-01-01T12:00:00.000Z';
    const createDto: CreateIncidentDto = {
      userId: singInUserId,
      type: IncidentTypeEnum.MIGRAINE_ATTACK,
      startTime: incidentStartDateTime,
      durationHours: 2,
      notes: 'Started after stress',
      triggers: triggersCreate,
      datetimeAt: incidentDateTime,
    };
    const expiredToken = await jwtService.signPayload(
      {
        userId: 'expired-id',
        email: 'expired@example.com',
        key: crypto.randomBytes(32).toString('hex'),
        role: Role.USER,
      },
      '1s',
    );

    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send(createDto)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should return 400 for invalid date format', async () => {
    const invalidDto = {
      userId: user.id,
      type: IncidentTypeEnum.MIGRAINE_ATTACK,
      startTime: 'not-a-date',
      durationHours: 2,
      notes: 'Invalid date test',
      triggers: [TriggerTypeEnum.STRESS],
      datetimeAt: '2023-01-01T12:00:00.000Z',
    };

    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should return 400 when required fields are missing', async () => {
    const incompleteDto = {
      userId: 'user123',
      notes: 'Missing type and startTime',
    };

    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send(incompleteDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should return 400 for invalid incident type', async () => {
    const invalidEnumDto = {
      userId: 'user123',
      type: 'INVALID_TYPE',
      startTime: '2023-01-01T10:00:00.000Z',
      durationHours: 2,
      notes: 'Invalid enum test',
      triggers: [TriggerTypeEnum.STRESS],
      datetimeAt: '2023-01-01T12:00:00.000Z',
    };

    await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidEnumDto)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should return 200 update only notes field and preserve others', async () => {
    const patchDto = { notes: 'Updated notes only' };

    const res = await request(app.getHttpServer() as Server)
      .patch(`/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(patchDto)
      .expect(HttpStatus.OK);

    expect(res.body).toHaveProperty('notes', 'Updated notes only');
    expect(res.body).toHaveProperty('type', IncidentTypeEnum.MIGRAINE_ATTACK);
  });
});
