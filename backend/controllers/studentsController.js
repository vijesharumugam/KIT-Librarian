const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

// GET /api/students
// Optional: ?search=term (matches registerNumber or phoneNumber, case-insensitive)
// Returns: registerNumber, phoneNumber, booksBorrowedCount, overdueBooksCount
const listStudents = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search && String(search).trim() !== '') {
      const s = String(search).trim();
      query.$or = [
        { registerNumber: { $regex: s, $options: 'i' } },
        { phoneNumber: { $regex: s, $options: 'i' } },
      ];
    }

    const students = await Student.find(query, { registerNumber: 1, phoneNumber: 1, currentBooks: 1 })
      .sort({ registerNumber: 1 })
      .lean();

    const now = new Date();
    // Compute counts per student. Overdue is based on active transactions with dueDate < now
    const results = await Promise.all(students.map(async (s) => {
      const booksBorrowedCount = Array.isArray(s.currentBooks) ? s.currentBooks.length : 0;
      const overdueBooksCount = await Transaction.countDocuments({
        studentId: s._id,
        returnDate: null,
        dueDate: { $lt: now },
      });
      return {
        _id: s._id,
        registerNumber: s.registerNumber,
        phoneNumber: s.phoneNumber,
        booksBorrowedCount,
        overdueBooksCount,
      };
    }));

    res.json(results);
  } catch (err) {
    console.error('List students error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listStudents };
