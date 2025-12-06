import fs from 'fs';
import path from 'path';

const configPath = path.join(__dirname, '../../.jest-test-env.json');

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (config.mongoUri) {
    process.env.MONGO_URI = config.mongoUri;
  }
}
