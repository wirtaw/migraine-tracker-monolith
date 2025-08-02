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

  console.log('Starting MongoDB Docker container...');
  if (isPodman) {
    await execAsync('podman-compose -f ../../docker-compose.test.yml up -d');
  } else {
    await execAsync('docker-compose -f ../../docker-compose.test.yml up -d');
  }

  // Wait for the MongoDB container to be ready
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log('MongoDB container started.');
  // Set reference to mongod in order to close the server during teardown.
};
