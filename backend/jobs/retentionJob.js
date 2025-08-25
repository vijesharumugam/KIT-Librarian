// Lightweight daily retention/anonymization scheduler without external deps
const { config } = require('../config/env');
const Student = require('../models/Student');

function randomSuffix(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function anonymizeOldStudents(cutoff) {
  const query = {
    createdAt: { $lt: cutoff },
    $or: [
      { anonymizedAt: null },
      { anonymizedAt: { $exists: false } },
    ],
  };

  const candidates = await Student.find(query).limit(500);
  let updated = 0;
  for (const s of candidates) {
    try {
      // Leave registerNumber if it is the unique key required for business logic; otherwise scrub.
      const token = randomSuffix();
      s.name = `Anonymized ${token}`;
      s.phoneNumber = `0000000000`;
      // Clear any non-essential relationships
      // Keep counts for statistics
      s.anonymizedAt = new Date();
      await s.save({ validateBeforeSave: false });
      updated++;
    } catch (e) {
      // continue
    }
  }
  return updated;
}

async function runRetentionCycle(logger = console) {
  const days = config.RETENTION_DAYS;
  if (!Number.isFinite(days) || days <= 0) {
    logger.warn('[Retention] RETENTION_DAYS is disabled or invalid; skipping.');
    return { updated: 0 };
  }
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  logger.log(`[Retention] Running anonymization for records older than ${days} days (cutoff ${cutoff.toISOString()})`);
  const updated = await anonymizeOldStudents(cutoff);
  logger.log(`[Retention] Students anonymized: ${updated}`);
  return { updated };
}

let intervalHandle = null;
function startRetentionScheduler(logger = console) {
  // Run once on boot after delay to ensure DB is connected
  setTimeout(() => runRetentionCycle(logger).catch(() => {}), 30_000);
  // Then run every 24 hours
  const dayMs = 24 * 60 * 60 * 1000;
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = setInterval(() => {
    runRetentionCycle(logger).catch((e) => logger.warn('[Retention] Error:', e?.message || e));
  }, dayMs);
  logger.log('[Retention] Scheduler started (every 24h).');
}

module.exports = { startRetentionScheduler, runRetentionCycle };
