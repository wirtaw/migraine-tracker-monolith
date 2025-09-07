// test/setup.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import type { Config } from '@jest/types';

const execAsync = promisify(exec);

dotenv.config({ path: '.env.test.local' });

const isPodman = process.env.IS_PODMAN && process.env.IS_PODMAN === 'true';

module.exports = async function (
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
) {
  console.log(globalConfig.testPathPatterns);
  console.log(projectConfig.cache);
  if (process.env.CI !== 'true') {
    console.log('Stopping and removing MongoDB Docker container locally...');
    try {
      if (isPodman) {
        await execAsync('podman-compose -f docker-compose.test.yml down -v');
      } else {
        await execAsync('docker-compose -f docker-compose.test.yml down -v');
      }

      console.log('MongoDB container stopped.');
    } catch (error) {
      console.error('Failed to stop MongoDB container:', error);
      process.exit(1);
    }
  } else {
    console.log('Running in CI environment, skipping local Docker teardown.');
    if (global.__MONGOD__) {
      await global.__MONGOD__.stop();
    }
  }
};
