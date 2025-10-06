import { Test, TestingModule } from '@nestjs/testing';
import { TestController } from './test.controller';

describe('TestController', () => {
  let testController: TestController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    testController = app.get<TestController>(TestController);
  });

  describe('getPublic()', () => {
    it(`should return "public ok"`, () => {
      expect(testController.getPublic()).toStrictEqual({
        message: 'public ok',
      });
    });
  });

  describe('getPrivate()', () => {
    it(`should return "public ok"`, () => {
      expect(testController.getPrivate()).toStrictEqual({
        message: 'private ok',
      });
    });
  });

  describe('getAdmin()', () => {
    it(`should return "public ok"`, () => {
      expect(testController.getAdmin()).toStrictEqual({ message: 'admin ok' });
    });
  });
});
