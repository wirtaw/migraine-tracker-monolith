import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  let testModule: TestingModule;

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    if (testModule) {
      await testModule.close();
    }
  });

  it('should validate the app module', () => {
    expect(testModule).toBeDefined();
  });
});
