// Daily due/overdue email reminders
const { config } = require('../config/env');
const { sendReminders } = require('../services/notificationService');

let intervalHandle = null;

function shouldRunNow(date = new Date()) {
  try {
    const hour = date.getHours();
    return hour === Number(config.NOTIFICATIONS_SEND_HOUR || 8);
  } catch {
    return true;
  }
}

async function runNotificationsCycle(logger = console) {
  if (!config.NOTIFICATIONS_ENABLED) {
    logger.log('[Notifications] Disabled via NOTIFICATIONS_ENABLED=false; skipping.');
    return { sent: 0, skipped: 0, total: 0, disabled: true };
  }
  const now = new Date();
  logger.log(`[Notifications] Running reminders at ${now.toISOString()}`);
  const res = await sendReminders(logger);
  logger.log(`[Notifications] Reminders sent=${res.sent}, skipped=${res.skipped}, batches=${res.total}`);
  return res;
}

function startNotificationsScheduler(logger = console) {
  // Initial delayed run on boot to allow DB connect
  setTimeout(async () => {
    try {
      if (shouldRunNow()) await runNotificationsCycle(logger);
    } catch (e) {
      logger.warn('[Notifications] Initial run failed:', e?.message || e);
    }
  }, 30_000);

  // Then check hourly; if hour matches configured, run once
  const hourMs = 60 * 60 * 1000;
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = setInterval(async () => {
    try {
      if (shouldRunNow()) await runNotificationsCycle(logger);
    } catch (e) {
      logger.warn('[Notifications] Scheduled run failed:', e?.message || e);
    }
  }, hourMs);
  logger.log('[Notifications] Scheduler started (hourly check).');
}

module.exports = { startNotificationsScheduler, runNotificationsCycle };
