import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { asAdmin, getSql, json } from './db.js';

const COOKIE_NAME = 'arr_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 h
const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEYLEN = 32;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'Falta SESSION_SECRET (>=32 chars). Definelo en .env.local y en Vercel.',
    );
  }
  return secret;
}

const b64url = {
  encode: (buf) =>
    Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (str) => {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
  },
};

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256');
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha256') return false;
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;
  const salt = Buffer.from(parts[3], 'base64');
  const expected = Buffer.from(parts[4], 'base64');
  const derived = pbkdf2Sync(password, salt, iterations, expected.length, 'sha256');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function sign(payloadB64) {
  return b64url.encode(createHmac('sha256', getSecret()).update(payloadB64).digest());
}

export function signSession(sub, ttl = SESSION_TTL_SECONDS) {
  const payload = { sub, exp: Math.floor(Date.now() / 1000) + ttl };
  const payloadB64 = b64url.encode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(b64url.decode(payloadB64).toString('utf8'));
    if (!payload || typeof payload.sub !== 'number') return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

function isSecureRequest(req) {
  if (process.env.NODE_ENV !== 'production') return false;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string') return proto.split(',')[0].trim() === 'https';
  return true;
}

export function setSessionCookie(req, res, token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(req, res) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function readSession(req) {
  const cookies = parseCookies(req.headers?.cookie);
  return verifySession(cookies[COOKIE_NAME]);
}

export async function getCurrentAdmin(req) {
  const session = readSession(req);
  if (!session) return null;
  const sql = getSql();
  const [row] = await sql`
    select id, username, created_at, last_login_at
    from admins where id = ${session.sub}
    limit 1
  `;
  return row ? asAdmin(row) : null;
}

export function requireAuth(handler) {
  return async (req, res) => {
    const admin = await getCurrentAdmin(req);
    if (!admin) return json(res, 401, { error: 'No autorizado' });
    req.admin = admin;
    return handler(req, res);
  };
}
