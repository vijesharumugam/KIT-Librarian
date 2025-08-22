const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// POST /api/student/register
// Body: { registerNumber, phoneNumber, password }
async function registerStudent(req, res) {
  try {
    const { registerNumber, phoneNumber, password } = req.body;
    if (!registerNumber || !phoneNumber || !password) {
      return res.status(400).json({ message: 'registerNumber, phoneNumber and password are required' });
    }

    const exists = await Student.findOne({ registerNumber });
    if (exists) {
      return res.status(409).json({ message: 'registerNumber already exists' });
    }

    const student = new Student({ registerNumber, phoneNumber, password, currentBooks: [] });
    await student.save(); // password hashed via pre-save hook

    const token = jwt.sign(
      { id: student._id, registerNumber: student.registerNumber, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.cookie('studentToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ message: 'Student registered successfully' });
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

    const token = jwt.sign(
      { id: student._id, registerNumber: student.registerNumber, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.cookie('studentToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ message: 'Login successful' });
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
      sameSite: 'lax',
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
};
