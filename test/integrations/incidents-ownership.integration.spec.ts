import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import request from 'supertest';
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AppModule } from '../../src/app.module';
import type { Server } from 'node:http';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { type User as SupabaseUser, type Session } from '@supabase/supabase-js';
import {
  Incident,
  IncidentDocument,
} from '../../src/incidents/schemas/incident.schema';
import { CustomJwtService } from '../../src/auth/jwt.service';
import { IncidentTypeEnum } from '../../src/incidents/enums/incident-type.enum';
import { TriggerTypeEnum } from '../../src/triggers/enums/trigger-type.enum';
import { SupabaseService } from '../../src/auth/supabase/supabase.service';
import { Role } from '../../src/auth/enums/roles.enum';
import { IIncident } from '../../src/incidents/interfaces/incident.interface';
import { CreateIncidentDto } from '../../src/incidents/dto/create-incident.dto';

describe('Incidents Ownership Access (integration)', () => {
  let app: INestApplication;
  let incidentModel: Model<IncidentDocument>;
  let incidentId: string;
  let mockHttpService;
  let connection: Connection;
  let jwtService: CustomJwtService;

  const userA: SupabaseUser = {
    id: 'userA-id',
    email: 'userA@example.com',
    app_metadata: {},
    user_metadata: { role: Role.USER },
    aud: '',
    created_at: new Date().toLocaleDateString(),
  };

  const userB: SupabaseUser = {
    id: 'userB-id',
    email: 'userB@example.com',
    app_metadata: {},
    user_metadata: { role: Role.USER },
    aud: '',
    created_at: new Date().toLocaleDateString(),
  };
  const token_type = 'bearer';
  const sessionUserA: Session = {
    access_token: 'tokenA',
    refresh_token: 'refreshA',
    expires_in: 100,
    token_type,
    user: userA,
  };

  const sessionUserB: Session = {
    access_token: 'tokenB',
    refresh_token: 'refreshB',
    expires_in: 100,
    token_type,
    user: userB,
  };

  const mockSupabaseService = {
    client: {
      auth: {
        signUp: jest
          .fn()
          .mockResolvedValueOnce({
            data: {
              user: userA,
            },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              user: userB,
            },
            error: null,
          }),

        signInWithPassword: jest
          .fn()
          .mockResolvedValueOnce({
            data: {
              user: userA,
              session: sessionUserA,
            },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              user: userB,
              session: sessionUserB,
            },
            error: null,
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

    jwtService = moduleFixture.get<CustomJwtService>(CustomJwtService);
    connection = moduleFixture.get<Connection>(getConnectionToken());
    incidentModel = moduleFixture.get<Model<IncidentDocument>>(
      getModelToken(Incident.name),
    );

    sessionUserA.access_token = await jwtService.signPayload(
      {
        userId: userA.id,
        email: userA.email,
        key: '0123456789abcdef0123456789abcdef',
        role: Role.USER,
      },
      '6 h',
    );

    sessionUserB.access_token = await jwtService.signPayload(
      {
        userId: userB.id,
        email: userB.email,
        key: '0123456789abcdef0123456789abcdef',
        role: Role.USER,
      },
      '6 h',
    );

    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        longitude: '1',
        latitude: '1',
        birthDate: '2000-01-01',
        email: userA.email,
        password: 'password123',
      });

    await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: userA.email, password: 'password123' });

    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        longitude: '2',
        latitude: '2',
        birthDate: '1998-02-02',
        email: userB.email,
        password: 'password124',
      });

    await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: userB.email, password: 'password124' });

    const createDto: CreateIncidentDto = {
      userId: userA.id,
      type: IncidentTypeEnum.MIGRAINE_ATTACK,
      startTime: '2023-01-01T10:00:00.000Z',
      durationHours: 2,
      notes: 'Created by userA',
      triggers: [TriggerTypeEnum.STRESS],
      datetimeAt: '2023-01-01T12:00:00.000Z',
    };

    const res = await request(app.getHttpServer() as Server)
      .post('/incidents')
      .set('Authorization', `Bearer ${sessionUserA.access_token}`)
      .send(createDto)
      .expect(HttpStatus.CREATED);

    const resBody = res.body as IIncident;

    incidentId = resBody.id;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  it('should allow owner to access their incident', async () => {
    Logger.log(`Incidents ${incidentId}. Token ${sessionUserA.access_token}`);
    const res = await request(app.getHttpServer() as Server)
      .get(`/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${sessionUserA.access_token}`)
      .expect(HttpStatus.OK);

    const incBody = res.body as IIncident;

    const incidentInDb = await incidentModel
      .findOne({ userId: userA.id })
      .lean();

    if (!incidentInDb) throw new Error('Incident not found in DB');
    incidentId = (incidentInDb._id as any).toString();

    expect(incBody.notes).toBe('Created by userA');
  });

  it('should forbid access to incident owned by another user', async () => {
    await request(app.getHttpServer() as Server)
      .get(`/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${sessionUserB.access_token}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should forbid updating incident owned by another user', async () => {
    await request(app.getHttpServer() as Server)
      .patch(`/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${sessionUserB.access_token}`)
      .send({ notes: 'Malicious update' })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should forbid deleting incident owned by another user', async () => {
    await request(app.getHttpServer() as Server)
      .delete(`/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${sessionUserB.access_token}`)
      .expect(HttpStatus.NOT_FOUND);
  });
});
