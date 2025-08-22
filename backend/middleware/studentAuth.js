const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Verify JWT for student users
module.exports = async function studentAuth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded || decoded.role !== 'student') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const student = await Student.findById(decoded.id);
    if (!student) return res.status(401).json({ message: 'Student not found' });

    req.student = student;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
