// Centralized environment configuration and basic validation (no external deps)
const crypto = require('crypto');
require('dotenv').config({ override: true });

function asInt(val, def) {
  const n = parseInt(String(val ?? '').trim(), 10);
  return Number.isFinite(n) ? n : def;
}

function asBool(val, def = false) {
  if (val === undefined || val === null) return def;
  const s = String(val).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return def;
}

function ensureMinLen(name, val, minLen) {
  if (!val || String(val).length < minLen) {
    const msg = `[config] ${name} must be set and at least ${minLen} chars long`;
    console.warn(msg);
  }
}

function sanitizeMongoUri(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (/NODE_ENV\s*=/.test(s)) {
    console.warn('[config] Detected extra content appended to MONGODB_URI (e.g., NODE_ENV=...). Sanitizing.');
    return s.split(/NODE_ENV\s*=/)[0].trim();
  }
  return s;
}

const config = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: asInt(process.env.PORT, 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  // Database
  MONGODB_URI: sanitizeMongoUri(process.env.MONGODB_URI) || 'mongodb://127.0.0.1:27017/kit-librarian',

  // Auth (rotation-aware)
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'your-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_ACCESS_SECRET_CURRENT: process.env.JWT_ACCESS_SECRET_CURRENT || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  JWT_ACCESS_SECRET_PREV: process.env.JWT_ACCESS_SECRET_PREV || '',
  TOKEN_ACCESS_TTL: process.env.TOKEN_ACCESS_TTL || '15m',
  TOKEN_REFRESH_TTL: process.env.TOKEN_REFRESH_TTL || '7d',

  // Data Retention / Analytics
  RETENTION_DAYS: asInt(process.env.RETENTION_DAYS, 365),
  ANALYTICS_ENABLED: asBool(process.env.ANALYTICS_ENABLED, false),

  // Notifications / Email
  NOTIFICATIONS_ENABLED: asBool(process.env.NOTIFICATIONS_ENABLED, true),
  DUE_SOON_DAYS: asInt(process.env.DUE_SOON_DAYS, 2),
  NOTIFICATIONS_SEND_HOUR: asInt(process.env.NOTIFICATIONS_SEND_HOUR, 8), // 0-23 local time
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: asInt(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Kit Librarian <no-reply@example.com>',
});

// Basic warnings (non-fatal) for weak secrets
ensureMinLen('JWT_ACCESS_SECRET', config.JWT_ACCESS_SECRET, 16);
ensureMinLen('JWT_REFRESH_SECRET', config.JWT_REFRESH_SECRET, 16);
if (!config.JWT_ACCESS_SECRET_CURRENT) {
  console.warn('[config] JWT_ACCESS_SECRET_CURRENT not set; falling back to JWT_ACCESS_SECRET');
}

// Helper to mask URIs in logs
function maskMongoUri(uri) {
  try {
    return String(uri).replace(/:\/\/([^:@]+):([^@]+)@/, '://$1:****@');
  } catch {
    return uri;
  }
}

function getAccessSecrets() {
  // current, prev with fallback to legacy single secret
  const current = config.JWT_ACCESS_SECRET_CURRENT || config.JWT_ACCESS_SECRET;
  const prev = config.JWT_ACCESS_SECRET_PREV || '';
  return { current, prev };
}

module.exports = { config, maskMongoUri, getAccessSecrets };
