const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const { config } = require('../config/env');
const { verifyAccess } = require('../utils/jwt');

// Admin auth (backward compatible default export)
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = verifyAccess(token);
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Student auth
async function verifyStudent(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.studentToken;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = verifyAccess(token);
    if (!decoded || decoded.role !== 'student') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const student = await Student.findById(decoded.id).select('-password');
    if (!student) return res.status(401).json({ message: 'Student not found' });

    req.student = student;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = authMiddleware; // default export remains admin middleware
module.exports.verifyStudent = verifyStudent; // named export for student auth
