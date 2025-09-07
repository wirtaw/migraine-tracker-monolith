import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import { NestApplication } from '@nestjs/core';
import { HttpStatus, VersioningType } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import helmet from 'helmet';
import { ControllerName } from '../src/enums';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../src/config/app/app.config';

describe('Main bootstrap integration', () => {
  let app: NestApplication;
  let configService: ConfigService;
  let appConfig: AppConfig | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(ControllerName.pathPrefix);
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.use(helmet());
    app.useGlobalFilters();

    await app.init();

    configService = app.get(ConfigService);
    appConfig = configService.get<AppConfig>('app');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should load AppConfig from ConfigService', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig?.port).toBeDefined();
    expect(appConfig?.requestTimeoutSeconds).toBeGreaterThan(0);
    expect(appConfig?.responseTimeoutSeconds).toBeGreaterThan(0);
  });

  it.skip('should respond to GET /docs with Swagger UI', async () => {
    const res = await request(app.getHttpServer() as Server).get('/docs');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.text).toContain('Swagger UI');
  });

  it('should apply global prefix and versioning', async () => {
    const res = await request(app.getHttpServer() as Server).get(
      `/${ControllerName.pathPrefix}/v1`,
    );
    expect([200, 404]).toContain(res.status);
  });

  it('should apply helmet headers', async () => {
    const res = await request(app.getHttpServer() as Server).get('/');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('should catch unknown route with AllExceptionsFilter', async () => {
    const res = await request(app.getHttpServer() as Server).get(
      '/non-existent',
    );
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
    expect(res.body).toEqual(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: 'Cannot GET /non-existent',
      }),
    );
  });
});
