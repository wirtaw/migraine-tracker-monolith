// test/setup.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import type { Config } from '@jest/types';

declare global {
  var __MONGOD__: MongoMemoryServer;
}

const execAsync = promisify(exec);

dotenv.config({ path: '.env.test.local' });

const isPodman = process.env.IS_PODMAN && process.env.IS_PODMAN === 'true';

module.exports = async function (
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
) {
  if (process.env.CI !== 'true') {
    console.log(globalConfig.testPathPatterns);
    console.log(projectConfig.cache);

    console.log('Starting MongoDB Docker container locally...');
    try {
      if (isPodman) {
        await execAsync('podman-compose -f docker-compose.test.yml up -d');
      } else {
        await execAsync('docker-compose -f docker-compose.test.yml up -d');
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log('MongoDB container started.');
    } catch (error) {
      console.error('Failed to start MongoDB container:', error);
      process.exit(1);
    }
  } else {
    console.log('Running in CI environment, skipping local Docker setup.');
    const mongod = await MongoMemoryServer.create();
    console.log(`getUri ${mongod.getUri()}`);
    // process.env.MONGO_URI = mongod.getUri();
    // global.__MONGOD__ = mongod;
  }
};
