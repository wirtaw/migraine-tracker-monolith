import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppDict } from './enums/index';

describe('AppController', () => {
  let appController: AppController;
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (app) {
      await app.close();
    }
  });

  describe('root', () => {
    it(`should return "${AppDict.welcome}"`, () => {
      expect(appController.getHello()).toBe(AppDict.welcome);
    });
  });

  describe('status', () => {
    it('should return { status: "ok" }', () => {
      expect(appController.getStatus()).toEqual({ status: 'ok' });
    });
  });
});
