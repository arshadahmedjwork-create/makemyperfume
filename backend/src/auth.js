import crypto from 'crypto';

const KEYLEN = 64;
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, KEYLEN).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || typeof password !== 'string') return false;
  const [scheme, salt, expectedHex] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  let candidate;
  try {
    candidate = crypto.scryptSync(password, salt, expected.length);
  } catch {
    return false;
  }
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function createAdminToken(secret, ttlMs = SESSION_TTL_MS) {
  const payload = `admin.${Date.now() + ttlMs}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token, secret) {
  if (typeof token !== 'string' || !secret) return false;
  const [role, expiry, sig] = token.split('.');
  if (role !== 'admin' || !expiry || !sig) return false;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${role}.${expiry}`).digest();
  const provided = Buffer.from(sig, 'hex');
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
