const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Book = require('../models/Book');

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password with bcrypt
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard statistics
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const [
      totalStudents,
      totalBooks,
      issuedBooks,
      overdueBooks
    ] = await Promise.all([
      Student.countDocuments({}),
      Book.countDocuments({}),
      // Issued = books not available
      Book.countDocuments({ availability: false }),
      // Overdue = not available and dueDate in the past
      Book.countDocuments({ availability: false, dueDate: { $lt: now } })
    ]);
    return res.json({ totalStudents, totalBooks, issuedBooks, overdueBooks });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginAdmin,
  getStats
};
