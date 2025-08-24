const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const Book = require('../models/Book');

// POST /api/transactions/borrow
// Body: { registerNumber, bookId, dueDate }
const borrowBook = async (req, res) => {
  try {
    const { registerNumber, bookId, dueDate } = req.body;
    if (!registerNumber || !bookId || !dueDate) {
      return res.status(400).json({ message: 'registerNumber, bookId and dueDate are required' });
    }

    const student = await Student.findOne({ registerNumber });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const remaining = (book.totalQuantity || 0) - (book.issuedCount || 0);
    if (remaining <= 0) return res.status(400).json({ message: 'No copies available' });

    // Create transaction
    const tx = await Transaction.create({
      studentId: student._id,
      bookId: book._id,
      dueDate: new Date(dueDate),
    });

    // Update student (atomic) without triggering full validation
    await Student.updateOne(
      { _id: student._id },
      {
        $push: { currentBooks: book._id },
        $inc: { booksBorrowedCount: 1 },
      }
    );

    book.issuedCount = (book.issuedCount || 0) + 1;
    const newRemaining = (book.totalQuantity || 0) - (book.issuedCount || 0);
    book.availability = newRemaining > 0;
    // Do not set book.dueDate; due dates tracked per transaction
    await book.save();

    return res.status(201).json({ message: 'Book issued', transaction: tx });
  } catch (err) {
    console.error('Borrow error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/transactions/return
// Body: { transactionId } OR { bookId } OR { registerNumber, bookId }
const returnBook = async (req, res) => {
  try {
    const { transactionId, bookId, registerNumber } = req.body;

    let tx = null;
    if (transactionId) {
      tx = await Transaction.findById(transactionId);
    } else if (bookId && registerNumber) {
      const student = await Student.findOne({ registerNumber });
      if (!student) return res.status(404).json({ message: 'Student not found' });
      tx = await Transaction.findOne({ bookId, studentId: student._id, returnDate: null });
    } else if (bookId) {
      tx = await Transaction.findOne({ bookId, returnDate: null });
    }

    if (!tx) return res.status(404).json({ message: 'Active transaction not found' });

    tx.returnDate = new Date();
    await tx.save();

    // Update book
    const book = await Book.findById(tx.bookId);
    if (book) {
      book.issuedCount = Math.max(0, (book.issuedCount || 0) - 1);
      const remaining = (book.totalQuantity || 0) - (book.issuedCount || 0);
      book.availability = remaining > 0;
      // Do not set book.dueDate; due dates tracked per transaction
      await book.save();
    }

    // Update student (atomic): remove book from currentBooks and decrement counters
    const decOverdue = tx.dueDate && new Date(tx.dueDate) < new Date();
    const incObj = { booksBorrowedCount: -1 };
    if (decOverdue) incObj.overdueBooksCount = -1;
    await Student.updateOne(
      { _id: tx.studentId },
      {
        $pull: { currentBooks: tx.bookId },
        $inc: incObj,
      }
    );

    return res.json({ message: 'Book returned', transaction: tx });
  } catch (err) {
    console.error('Return error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { borrowBook, returnBook };

// GET /api/transactions/issued
// Returns all active (not returned) transactions with populated book title and student registerNumber
async function listIssued(req, res) {
  try {
    const txs = await Transaction.find({ returnDate: null })
      .populate({ path: 'bookId', select: 'title' })
      .populate({ path: 'studentId', select: 'registerNumber name' })
      .sort({ issueDate: -1 })
      .lean();
    const items = txs.map((t) => ({
      _id: t._id,
      book: t.bookId ? { _id: t.bookId._id, title: t.bookId.title } : null,
      student: t.studentId ? { _id: t.studentId._id, registerNumber: t.studentId.registerNumber, name: t.studentId.name } : null,
      dueDate: t.dueDate,
      issueDate: t.issueDate,
    }));
    return res.json(items);
  } catch (err) {
    console.error('List issued error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/transactions/return/:id
// Marks a transaction as returned and updates related Book and Student
async function returnById(req, res) {
  try {
    const { id } = req.params;
    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (tx.returnDate) return res.status(400).json({ message: 'Transaction already returned' });

    tx.returnDate = new Date();
    await tx.save();

    // Update book
    const book = await Book.findById(tx.bookId);
    if (book) {
      book.issuedCount = Math.max(0, (book.issuedCount || 0) - 1);
      const remaining = (book.totalQuantity || 0) - (book.issuedCount || 0);
      book.availability = remaining > 0; // set availability based on remaining
      await book.save();
    }

    // Update student (atomic): remove book and decrement counters
    const decOverdue2 = tx.dueDate && new Date(tx.dueDate) < new Date();
    const incObj2 = { booksBorrowedCount: -1 };
    if (decOverdue2) incObj2.overdueBooksCount = -1;
    await Student.updateOne(
      { _id: tx.studentId },
      {
        $pull: { currentBooks: tx.bookId },
        $inc: incObj2,
      }
    );

    return res.json({ message: 'Book returned', transaction: tx });
  } catch (err) {
    console.error('Return by id error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.listIssued = listIssued;
module.exports.returnById = returnById;

// GET /api/transactions/overdue
// Returns all active transactions whose dueDate is past now
async function listOverdue(req, res) {
  try {
    const now = new Date();
    const txs = await Transaction.find({ returnDate: null, dueDate: { $lt: now } })
      .populate({ path: 'bookId', select: 'title' })
      .populate({ path: 'studentId', select: 'registerNumber phoneNumber name' })
      .sort({ dueDate: 1 })
      .lean();
    const items = txs.map((t) => ({
      _id: t._id,
      book: t.bookId ? { _id: t.bookId._id, title: t.bookId.title } : null,
      student: t.studentId ? { _id: t.studentId._id, registerNumber: t.studentId.registerNumber, name: t.studentId.name, phoneNumber: t.studentId.phoneNumber } : null,
      dueDate: t.dueDate,
      issueDate: t.issueDate,
    }));
    return res.json(items);
  } catch (err) {
    console.error('List overdue error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.listOverdue = listOverdue;
