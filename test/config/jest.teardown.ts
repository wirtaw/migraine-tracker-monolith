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
  console.log('Stopping and removing MongoDB Docker container...');
  if (isPodman) {
    await execAsync('podman-compose -f ../../docker-compose.test.yml down -v');
  } else {
    await execAsync('docker-compose -f ../../docker-compose.test.yml down -v');
  }

  console.log('MongoDB container stopped.');
};
