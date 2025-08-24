/*
 One-time migration: backfill Student.name and Student.department
 Default values:
  - name: "abcd"
  - department: "Artificial Intelligence and Data Science"

 Run with:
   node backend/scripts/migrate-students-add-name-department.js
*/

require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');

(async function run() {
  try {
    await connectDB();

    const DEFAULT_NAME = 'abcd';
    const DEFAULT_DEPT = 'Artificial Intelligence and Data Science';

    // Find students missing either field or having empty/whitespace value
    const query = {
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' },
        { department: { $exists: false } },
        { department: null },
        { department: '' },
      ],
    };

    const students = await Student.find(query).lean();
    console.log(`Found ${students.length} student(s) to migrate.`);

    let updated = 0;
    for (const s of students) {
      const update = {};
      if (!s.name || String(s.name).trim() === '') update.name = DEFAULT_NAME;
      if (!s.department || String(s.department).trim() === '') update.department = DEFAULT_DEPT;
      if (Object.keys(update).length) {
        await Student.updateOne({ _id: s._id }, { $set: update });
        updated += 1;
      }
    }

    console.log(`Updated ${updated} student(s).`);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
