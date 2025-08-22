const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/db');
const Student = require('../models/Student');

(async function run() {
  try {
    await connectDB();

    const students = await Student.find({});
    if (!students.length) {
      console.log('No students found. Nothing to update.');
      return process.exit(0);
    }

    let updated = 0;

    for (const s of students) {
      // If password already present and non-empty, skip
      if (s.password && typeof s.password === 'string' && s.password.trim().length > 0) {
        continue;
      }

      const hashed = await bcrypt.hash('12345678', 10);
      await Student.updateOne({ _id: s._id }, { $set: { password: hashed } });
      updated += 1;
    }

    console.log(`Updated ${updated} student(s) with default password.`);
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
})();
