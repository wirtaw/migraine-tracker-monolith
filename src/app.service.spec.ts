import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { AppDict } from './enums/index';

describe('AppService', () => {
  let service: AppService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it(`should return "${AppDict.welcome}"`, () => {
      const result = service.getHello();
      expect(result).toBe(AppDict.welcome);
    });
  });

  describe('getStatus', () => {
    it('should return { status: "ok" }', () => {
      const result = service.getStatus();
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
