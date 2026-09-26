import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { hashPassword } from '../src/auth.js';

const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), '../.env');

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node backend/scripts/set-admin-password.js <email> <password>');
  process.exit(1);
}

if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

function upsertEnvVar(contents, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  return pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
}

let env = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';

env = upsertEnvVar(env, 'ADMIN_EMAIL', email.toLowerCase().trim());
env = upsertEnvVar(env, 'ADMIN_PASSWORD_HASH', hashPassword(password));

if (!/^ADMIN_SESSION_SECRET=.+$/m.test(env)) {
  env = upsertEnvVar(env, 'ADMIN_SESSION_SECRET', crypto.randomBytes(32).toString('hex'));
  console.log('Generated a new ADMIN_SESSION_SECRET.');
}

writeFileSync(ENV_PATH, env, 'utf8');

console.log(`Admin credentials saved for ${email}.`);
console.log('Restart the backend for the change to take effect.');
