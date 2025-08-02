// test/setup.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

const execAsync = promisify(exec);

dotenv.config({ path: '.env.test.local' });

const isPodman = process.env.IS_PODMAN && process.env.IS_PODMAN === 'true';

module.exports = async function (globalConfig, projectConfig) {
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

      // Wait for the MongoDB container to be ready
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log('MongoDB container started.');
      // Set reference to mongod in order to close the server during teardown.
    } catch (error) {
      console.error('Failed to start MongoDB container:', error);
      process.exit(1);
    }
  } else {
    console.log('Running in CI environment, skipping local Docker setup.');
  }
};
