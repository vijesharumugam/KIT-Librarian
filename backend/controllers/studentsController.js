const Student = require('../models/Student');

// GET /api/students - list minimal student info
const listStudents = async (req, res) => {
  try {
    const students = await Student.find({}, { registerNumber: 1, phoneNumber: 1 }).sort({ registerNumber: 1 });
    res.json(students);
  } catch (err) {
    console.error('List students error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listStudents };
