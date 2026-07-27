import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const botRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(botRoot, '.env');
const loaded = dotenv.config({ path: envPath, override: true });

if (!fs.existsSync(envPath)) {
  console.error(`Missing ${envPath}. Copy .env.example to .env and fill Discord credentials.`);
} else if (loaded.error) {
  console.error(`Failed to read ${envPath}:`, loaded.error.message);
}