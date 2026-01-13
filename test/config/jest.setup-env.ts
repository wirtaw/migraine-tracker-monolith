import fs from 'fs';
import path from 'path';

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
// Set a default JWT_SECRET for tests if not already present
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_secret_key_for_unit_tests';
}
