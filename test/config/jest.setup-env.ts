import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.join(__dirname, '../../.env.test.local');
dotenv.config({ path: envPath });

// Set default JWT_SECRET for tests if not already present
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_secret_key_for_unit_tests';
}

// Set default Cloudflare Worker env vars for tests if not already present
if (!process.env.CLOUDFLARE_WORKER_URL) {
  process.env.CLOUDFLARE_WORKER_URL = 'http://localhost/worker';
}
if (!process.env.CLOUDFLARE_WORKER_HEADER_KEY) {
  process.env.CLOUDFLARE_WORKER_HEADER_KEY = 'test-header-key';
}
if (!process.env.CF_ACCESS_CLIENT_ID) {
  process.env.CF_ACCESS_CLIENT_ID = 'test-client-id';
}
if (!process.env.CF_ACCESS_CLIENT_SECRET) {
  process.env.CF_ACCESS_CLIENT_SECRET = 'test-client-secret';
}

if (!process.env.MONGODB_DB_NAME) {
  process.env.MONGODB_DB_NAME = 'test_db_name';
}

const configPath = path.join(__dirname, '../../.jest-test-env.json');

if (process.env.MONGO_URI) {
  // If env var is set, use it (CI or manual override)
  // No need to read file, but we can to be safe if we want to support both
} else if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (config.mongoUri) {
    process.env.MONGO_URI = config.mongoUri;
  }
}
