import { Test, TestingModule } from '@nestjs/testing';
import { TriggersController } from './triggers.controller';
import { TriggersService } from './triggers.service';

describe('TriggersController', () => {
  let controller: TriggersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriggersController],
      providers: [TriggersService],
    }).compile();

    controller = module.get<TriggersController>(TriggersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
