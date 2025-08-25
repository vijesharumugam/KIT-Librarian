#!/usr/bin/env node
require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');

const DEFAULT_EMAIL = 'kit27.ad59@gmail.com';

function parseArgs(argv) {
  const args = { email: DEFAULT_EMAIL };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email' || a === '-e') args.email = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function isValidEmail(s) {
  return /.+@.+\..+/.test(String(s || ''));
}

(async () => {
  const { email, help } = parseArgs(process.argv);
  if (help) {
    console.log(`\nUsage:\n  node scripts/set-all-students-email.js --email <email>\nDefault email: ${DEFAULT_EMAIL}\n`);
    process.exit(0);
  }
  if (!isValidEmail(email)) {
    console.error('Invalid email.');
    process.exit(1);
  }
  try {
    await connectDB();
    const res = await Student.updateMany({}, { $set: { email: email.toLowerCase() } });
    console.log(`Updated ${res.modifiedCount ?? res.nModified ?? 0} students to email ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error updating student emails:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
})();
