const nodemailer = require('nodemailer');
const { config } = require('../config/env');

let transporter = null;

function ensureTransport() {
  if (!config.NOTIFICATIONS_ENABLED) return null;
  if (!transporter) {
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      console.warn('[Mailer] SMTP not fully configured; emails will be skipped.');
      return null;
    }
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, // true for 465, false for others
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  if (!config.NOTIFICATIONS_ENABLED) {
    console.log('[Mailer] NOTIFICATIONS_ENABLED=false; skipping email to', to);
    return { skipped: true };
  }
  const tx = ensureTransport();
  if (!tx) {
    console.warn('[Mailer] Transport unavailable; skipping email to', to);
    return { skipped: true };
  }
  const from = config.SMTP_FROM || 'Kit Librarian <no-reply@example.com>';
  const info = await tx.sendMail({ from, to, subject, text, html });
  return { messageId: info.messageId, accepted: info.accepted };
}

module.exports = { sendMail };
