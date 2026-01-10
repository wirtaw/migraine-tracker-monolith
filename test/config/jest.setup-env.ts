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
