import { Test } from '@nestjs/testing';
import { LocationsModule } from './locations.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('LocationsModule', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  it('should compile the module', async () => {
    const mongoUri = mongoServer.getUri();

    const module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongoUri), LocationsModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(LocationsModule)).toBeDefined();
  });
});
