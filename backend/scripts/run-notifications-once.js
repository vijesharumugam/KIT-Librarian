#!/usr/bin/env node
require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { runNotificationsCycle } = require('../jobs/notificationsJob');

(async () => {
  try {
    await connectDB();
    const res = await runNotificationsCycle(console);
    console.log('Notifications result:', res);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Failed to run notifications:', e?.message || e);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
})();
