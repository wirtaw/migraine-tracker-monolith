import { Test, TestingModule } from '@nestjs/testing';
import { HealthLogsController } from './health-logs.controller';
import { HealthLogsService } from './health-logs.service';

describe('HealthLogsController', () => {
  let controller: HealthLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthLogsController],
      providers: [HealthLogsService],
    }).compile();

    controller = module.get<HealthLogsController>(HealthLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
