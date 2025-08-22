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
    if (!book.availability) return res.status(400).json({ message: 'Book is not available' });

    // Create transaction
    const tx = await Transaction.create({
      studentId: student._id,
      bookId: book._id,
      dueDate: new Date(dueDate),
    });

    // Update student and book: store only Book ObjectId in student's currentBooks
    student.currentBooks.push(book._id);
    await student.save();

    book.availability = false;
    book.dueDate = new Date(dueDate);
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
      book.availability = true;
      book.dueDate = null;
      await book.save();
    }

    // Update student
    const student = await Student.findById(tx.studentId);
    if (student) {
      student.currentBooks = (student.currentBooks || []).filter(
        (cb) => cb.toString() !== tx.bookId.toString()
      );
      await student.save();
    }

    return res.json({ message: 'Book returned', transaction: tx });
  } catch (err) {
    console.error('Return error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { borrowBook, returnBook };
