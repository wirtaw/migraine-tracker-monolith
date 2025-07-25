import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { AppDict } from './enums/index';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
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
});
