#!/usr/bin/env node
require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--id' || a === '-i') args.id = argv[++i];
    else if (a === '--register' || a === '-r') args.registerNumber = argv[++i];
    else if (a === '--email' || a === '-e') args.email = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printUsage() {
  console.log(`\nUsage:\n  node scripts/set-student-email.js --register <regNo> --email <email>\n  node scripts/set-student-email.js --id <studentId> --email <email>\n\nExamples:\n  node scripts/set-student-email.js -r 22CSE123 -e student@example.com\n  node scripts/set-student-email.js -i 66ccaa112233445566778899 -e student@example.com\n`);
}

function isValidEmail(s) {
  return /.+@.+\..+/.test(String(s || ''));
}

(async () => {
  const { id, registerNumber, email, help } = parseArgs(process.argv);
  if (help || !email || (!id && !registerNumber)) {
    printUsage();
    process.exit(help ? 0 : 1);
  }
  if (!isValidEmail(email)) {
    console.error('Invalid email.');
    process.exit(1);
  }

  try {
    await connectDB();
    const query = id ? { _id: id } : { registerNumber };
    const student = await Student.findOne(query);
    if (!student) {
      console.error('Student not found for query:', query);
      process.exit(1);
    }
    student.email = email.toLowerCase();
    await student.save({ validateBeforeSave: false });
    console.log('Updated student email:', { id: student._id.toString(), name: student.name, registerNumber: student.registerNumber, email: student.email });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error updating student email:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
})();
