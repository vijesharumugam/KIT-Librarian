const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/student/login
// Body: { registerNumber, phoneNumber }
const requestOtp = async (req, res) => {
  try {
    const { registerNumber, phoneNumber } = req.body;
    if (!registerNumber || !phoneNumber) {
      return res.status(400).json({ message: 'registerNumber and phoneNumber are required' });
    }

    const student = await Student.findOne({ registerNumber });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.phoneNumber !== phoneNumber) {
      return res.status(400).json({ message: 'Phone number does not match our records' });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    student.otpCode = otp;
    student.otpExpiry = expiry;
    await student.save();

    // Simulate SMS by logging to backend console
    console.log(`OTP for student ${registerNumber}: ${otp} (expires in 5 minutes)`);

    return res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP request error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/student/verify
// Body: { registerNumber, otp }
const verifyOtp = async (req, res) => {
  try {
    const { registerNumber, otp } = req.body;
    if (!registerNumber || !otp) {
      return res.status(400).json({ message: 'registerNumber and otp are required' });
    }

    const student = await Student.findOne({ registerNumber });
    if (!student || !student.otpCode || !student.otpExpiry) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    if (student.otpCode !== otp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(student.otpExpiry)) {
      // Clear expired OTP
      student.otpCode = null;
      student.otpExpiry = null;
      await student.save();
      return res.status(401).json({ message: 'OTP expired. Please request a new one.' });
    }

    // OTP valid -> issue JWT
    const token = jwt.sign(
      { id: student._id, registerNumber: student.registerNumber, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // For demo: store token in DB as requested
    student.lastLoginToken = token;
    // Clear OTP after successful verification
    student.otpCode = null;
    student.otpExpiry = null;
    await student.save();

    return res.json({
      message: 'OTP verified successfully',
      token,
      student: {
        id: student._id,
        registerNumber: student.registerNumber,
        phoneNumber: student.phoneNumber
      }
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
  // GET /api/student/current (protected)
  // Returns student's current borrowed books with due dates
  async getCurrentStudent(req, res) {
    try {
      const studentId = req.student?._id || null;
      if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

      const student = await Student.findById(studentId)
        .populate('currentBooks.bookId')
        .lean();
      if (!student) return res.status(404).json({ message: 'Student not found' });

      return res.json({
        id: student._id,
        registerNumber: student.registerNumber,
        currentBooks: (student.currentBooks || []).map((cb) => ({
          book: cb.bookId ? {
            _id: cb.bookId._id,
            title: cb.bookId.title,
            author: cb.bookId.author,
            isbn: cb.bookId.isbn,
          } : null,
          dueDate: cb.dueDate,
        })),
      });
    } catch (error) {
      console.error('Get current student error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};
