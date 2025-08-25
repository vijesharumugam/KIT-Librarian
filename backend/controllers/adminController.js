const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { config } = require('../config/env');
const { signAccess } = require('../utils/jwt');
const { runNotificationsCycle } = require('../jobs/notificationsJob');
const { buildReminderBatches, renderEmail } = require('../services/notificationService');

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

    // Generate JWT token (rotation-aware)
    const token = signAccess({ id: admin._id, username: admin.username });

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

// Manually trigger notifications cycle
const runNotifications = async (req, res) => {
  try {
    const result = await runNotificationsCycle(console);
    return res.json({ message: 'Notifications run completed', result });
  } catch (error) {
    console.error('Run notifications error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Preview notification email for a specific student
const previewNotification = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const now = new Date();
    const batches = await buildReminderBatches(now);
    const batch = batches.find(b => String(b.student._id) === String(studentId));
    if (!batch) return res.status(404).json({ message: 'No due/overdue items for this student or student not found' });

    const { subject, text, html } = renderEmail(batch);
    return res.json({ subject, text, html, counts: { dueSoon: batch.dueSoonItems.length, overdue: batch.overdueItems.length } });
  } catch (error) {
    console.error('Preview notification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard statistics
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const [studentsCount, booksCount, issuedAgg, overdueTx] = await Promise.all([
      Student.countDocuments({}),
      Book.countDocuments({}), // number of rows/documents in books collection
      Book.aggregate([
        {
          $group: {
            _id: null,
            issuedCount: { $sum: { $ifNull: ["$issuedCount", 0] } },
          },
        },
      ]),
      Transaction.countDocuments({ returnDate: null, dueDate: { $lt: now } }),
    ]);

    const issuedCount = issuedAgg[0]?.issuedCount || 0;
    return res.json({
      totalStudents: studentsCount,
      totalBooks: booksCount,
      issuedBooks: issuedCount,
      overdueBooks: overdueTx,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginAdmin,
  getStats,
  runNotifications,
  previewNotification,
};
