// test/setup.ts

import { exec } from 'child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import type { Config } from '@jest/types';

declare global {
  var __MONGOD__: MongoMemoryServer;
}

const execAsync = promisify(exec);

dotenv.config({ path: path.join(__dirname, '../../.env.test.local') });

const isPodman = process.env.IS_PODMAN && process.env.IS_PODMAN === 'true';

export default async function (
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
) {
  const useDocker = process.env.USE_DOCKER === 'true';

  if (process.env.MONGO_URI) {
    console.log(`Using provided Mongo URI: ${process.env.MONGO_URI}`);
    // Write the URI to a temporary file so test suites can read it if they rely on it
    // although setup-env should also read env vars.
    const configPath = path.join(__dirname, '../../.jest-test-env.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ mongoUri: process.env.MONGO_URI }),
    );
    return;
  }

  // Cleanup any existing containers to ensure clean state
  try {
    console.log('Cleaning up any existing mongodb_test containers...');
    // We use execAsync directly here to ensure it finishes before we proceed
    // Ignoring errors because the container might not exist
    await execAsync('podman rm -f mongodb_test').catch(() => {});
    console.log('Cleanup complete.');
  } catch (e) {
    // Ignore cleanup errors
  }

  if (useDocker) {
    console.log('Starting MongoDB Docker container locally...');
    try {
      if (isPodman) {
        await execAsync('podman-compose -f docker-compose.test.yml up -d');
      } else {
        await execAsync('docker-compose -f docker-compose.test.yml up -d');
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log('MongoDB container started.');

      const uri = `mongodb://root:${process.env.MONGO_INITDB_ROOT_PASSWORD}@localhost:${process.env.MONGODB_PORT}/${process.env.MONGODB_DBNAME}?authSource=admin`;

      const configPath = path.join(__dirname, '../../.jest-test-env.json');
      fs.writeFileSync(configPath, JSON.stringify({ mongoUri: uri }));
    } catch (error) {
      console.error('Failed to start MongoDB container:', error);
      process.exit(1);
    }
  } else {
    console.log('Starting MongoMemoryServer...');
    const mongod = await MongoMemoryServer.create({
      binary: {
        version: '7.0.0',
      },
    });
    const uri = mongod.getUri();
    console.log(`MongoMemoryServer started at ${uri}`);

    // Store the instance in global for teardown
    global.__MONGOD__ = mongod;

    // Write the URI to a temporary file so test suites can read it
    const fs = await import('fs');
    const path = await import('path');

    const configPath = path.join(__dirname, '../../.jest-test-env.json');
    fs.writeFileSync(configPath, JSON.stringify({ mongoUri: uri }));
  }
}
