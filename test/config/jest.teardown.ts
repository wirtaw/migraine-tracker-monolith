// test/setup.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

const execAsync = promisify(exec);

dotenv.config({ path: '.env.test' });

const isPodman = process.env.IS_PODMAN && process.env.IS_PODMAN === 'true';

module.exports = async function (globalConfig, projectConfig) {
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
  }
};
