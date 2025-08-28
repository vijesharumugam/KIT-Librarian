const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { config } = require('../config/env');
const { signAccess } = require('../utils/jwt');

// POST /api/student/register
// Body: { registerNumber, phoneNumber, password, name, department, email? }
async function registerStudent(req, res) {
  try {
    const { registerNumber, phoneNumber, password, name, department, email } = req.body;
    if (!registerNumber || !phoneNumber || !password || !name || !department) {
      return res.status(400).json({ message: 'registerNumber, phoneNumber, password, name and department are required' });
    }
    if (String(name).trim() === '' || String(department).trim() === '') {
      return res.status(400).json({ message: 'name and department cannot be empty' });
    }

    let normalizedEmail = null;
    if (typeof email === 'string' && email.trim() !== '') {
      const e = email.trim().toLowerCase();
      const ok = /.+@.+\..+/.test(e);
      if (!ok) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      normalizedEmail = e;
    }

    const exists = await Student.findOne({ registerNumber });
    if (exists) {
      return res.status(409).json({ message: 'registerNumber already exists' });
    }

    const student = new Student({ registerNumber, phoneNumber, password, name: String(name).trim(), department: String(department).trim(), email: normalizedEmail, currentBooks: [] });
    await student.save(); // password hashed via pre-save hook

    const token = signAccess({ id: student._id, registerNumber: student.registerNumber, role: 'student' });

    res.cookie('studentToken', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Return created student's public info
    return res.status(201).json({
      message: 'Student registered successfully',
      id: student._id,
      registerNumber: student.registerNumber,
      name: student.name,
      department: student.department,
      email: student.email,
    });
  } catch (error) {
    console.error('Register student error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/student/login
// Body: { registerNumber, password }
async function loginStudent(req, res) {
  try {
    const { registerNumber, password } = req.body;
    if (!registerNumber || !password) {
      return res.status(400).json({ message: 'registerNumber and password are required' });
    }

    const student = await Student.findOne({ registerNumber });
    if (!student) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = signAccess({ id: student._id, registerNumber: student.registerNumber, role: 'student' });

    // Set cookie with iOS-compatible settings
    const cookieOptions = {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    };
    
    console.log('Setting cookie with options:', cookieOptions);
    res.cookie('studentToken', token, cookieOptions);

    return res.json({ 
      message: 'Login successful',
      token: token, // Also send token in response for iOS fallback
      student: {
        id: student._id,
        registerNumber: student.registerNumber,
        name: student.name,
        department: student.department
      }
    });
  } catch (error) {
    console.error('Login student error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/student/logout
function logoutStudent(req, res) {
  try {
    res.clearCookie('studentToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.json({ message: 'Logged out' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  registerStudent,
  loginStudent,
  logoutStudent,
  // GET /api/student/current (protected)
  // Returns student's current borrowed books
  async getCurrentStudent(req, res) {
    try {
      const studentId = req.student?._id || null;
      if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

      const student = await Student.findById(studentId)
        .populate('currentBooks')
        .lean();
      if (!student) return res.status(404).json({ message: 'Student not found' });

      return res.json({
        id: student._id,
        registerNumber: student.registerNumber,
        currentBooks: (student.currentBooks || []).map((book) => book ? ({
          _id: book._id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        }) : null),
      });
    } catch (error) {
      console.error('Get current student error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
  // GET /api/student/profile (protected)
  async getProfile(req, res) {
    try {
      const studentId = req.student?._id || null;
      if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
      const student = await Student.findById(studentId).lean();
      if (!student) return res.status(404).json({ message: 'Student not found' });
      return res.json({
        id: student._id,
        registerNumber: student.registerNumber,
        name: student.name,
        department: student.department,
        phoneNumber: student.phoneNumber,
        email: student.email ?? null,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      });
    } catch (e) {
      console.error('Get profile error:', e);
      return res.status(500).json({ message: 'Server error' });
    }
  },
  // PUT /api/student/profile (protected)
  // Body: { name?, department?, phoneNumber?, email? }
  async updateProfile(req, res) {
    try {
      const studentId = req.student?._id || null;
      if (!studentId) return res.status(401).json({ message: 'Unauthorized' });
      const allowed = {};
      const { name, department, phoneNumber, email } = req.body || {};
      if (typeof name === 'string') allowed.name = name.trim();
      if (typeof department === 'string') allowed.department = department.trim();
      if (typeof phoneNumber === 'string') allowed.phoneNumber = phoneNumber.trim();
      if (typeof email === 'string') {
        const val = email.trim();
        if (val !== '') {
          const e = val.toLowerCase();
          const ok = /.+@.+\..+/.test(e);
          if (!ok) return res.status(400).json({ message: 'Invalid email format' });
          allowed.email = e;
        } else {
          // allow clearing email explicitly
          allowed.email = null;
        }
      }
      // Prevent empty strings
      for (const [k, v] of Object.entries(allowed)) {
        if (v === '') delete allowed[k];
      }
      if (Object.keys(allowed).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      const updated = await Student.findByIdAndUpdate(studentId, { $set: allowed }, { new: true, runValidators: true }).lean();
      if (!updated) return res.status(404).json({ message: 'Student not found' });
      return res.json({
        message: 'Profile updated',
        id: updated._id,
        registerNumber: updated.registerNumber,
        name: updated.name,
        department: updated.department,
        phoneNumber: updated.phoneNumber,
        email: updated.email ?? null,
        updatedAt: updated.updatedAt,
      });
    } catch (e) {
      console.error('Update profile error:', e);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};
