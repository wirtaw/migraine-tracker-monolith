import { Test, TestingModule } from '@nestjs/testing';
import { HealthLogsService } from './health-logs.service';

describe('HealthLogsService', () => {
  let service: HealthLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthLogsService],
    }).compile();

    service = module.get<HealthLogsService>(HealthLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
