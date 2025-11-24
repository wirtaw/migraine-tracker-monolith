import { NestApplication, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  VersioningType,
  Logger,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { useContainer } from 'class-validator';

import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';
import { AppConfig } from './config/app/app.config';
import { ControllerName } from './enums/index';
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  /**
   * @description CORS Setup
   */
  // Configure allowed origins. You can fetch this from config if needed.
  app.enableCors({
    origin: [
      'http://localhost:5173', // Example: Frontend dev server
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // ---------------------------------------------------------------------------

  app.setGlobalPrefix(ControllerName.pathPrefix);
  /**
   * @description Versioning
   */
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  /**
   * @description Class validator
   */
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  /**
   * @description Security
   */
  app.use(helmet());

  /**
   * @description Logging
   */
  app.use(
    morgan('tiny', {
      stream: {
        write: (message: string) => Logger.log(message.trim()),
      },
    }),
  );

  /**
   * @description Global
   */
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(express.json({ limit: '5mb' }));

  /**
   * @description Configuration
   */
  const configService: ConfigService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  if (!appConfig) {
    Logger.error('Application configuration "app" is missing!', 'Bootstrap');
    throw new Error(
      'Application configuration "app" is not defined. Cannot start.',
    );
  }

  /**
   * @description Req & Res timeouts
   */
  app.use((request: Request, response: Response, next: NextFunction) => {
    request.setTimeout(appConfig.requestTimeoutSeconds, () => {
      throw new HttpException('Server Timeout', HttpStatus.REQUEST_TIMEOUT);
    });

    response.setTimeout(appConfig.responseTimeoutSeconds);

    next();
  });

  /**
   * @description OpenAPI Documentation
   */
  const config = new DocumentBuilder()
    .setTitle('Migraine Tracker Monolith')
    .setDescription('The description of your API')
    .setVersion('1.0')
    .addTag('auth', 'Operations related to auth')
    .addTag('health-logs', 'Operations related to health-logs')
    .addTag('incidents', 'Operations related to incidents')
    .addTag('locations', 'Operations related to locations')
    .addTag('medications', 'Operations related to medications')
    .addTag('symptoms', 'Operations related to symptoms')
    .addTag('triggers', 'Operations related to triggers')
    .addTag('users', 'Operations related to users')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  /**
   * @description  global filter for exceptions
   */
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'test') {
    await app.listen(appConfig.port, () =>
      Logger.log(`Service run on port: ${appConfig.port}`),
    );
  }
}
bootstrap()
  .then(() => {
    Logger.log(`Bootstrap started successfully ${NestApplication.name}`);
  })
  .catch((e: unknown) => {
    if (e instanceof Error) {
      Logger.error(e.stack, NestApplication.name);
    } else {
      const errorMessage = typeof e === 'string' ? e : JSON.stringify(e);
      Logger.error(
        `An unknown error occurred: ${errorMessage}`,
        NestApplication.name,
      );
    }
  });
