#!/usr/bin/env node
require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

(async () => {
  try {
    await connectDB();

    let student = await Student.findOne({});
    if (!student) {
      // Create a sample student if none exist
      student = new Student({
        name: 'Test Student',
        department: 'Testing',
        registerNumber: 'TEST123',
        phoneNumber: '0000000000',
        email: process.env.TEST_DEFAULT_EMAIL || 'kit27.ad59@gmail.com',
        password: 'password123',
      });
      await student.save();
      console.log('Created sample student:', { id: student._id.toString(), registerNumber: student.registerNumber });
    }

    let book = await Book.findOne({});
    if (!book) {
      // Create a sample book if none exist
      const randIsbn = 'TESTISBN-' + Math.floor(Math.random() * 1e9);
      book = new Book({
        title: 'Sample Book',
        author: 'Sample Author',
        isbn: randIsbn,
        totalQuantity: 1,
        issuedCount: 0,
        availability: true,
      });
      await book.save();
      console.log('Created sample book:', { id: book._id.toString(), isbn: book.isbn });
    }

    // Create an overdue transaction (due 3 days ago), returnDate null
    const issueDate = daysAgo(10);
    const dueDate = daysAgo(3);

    const tx = new Transaction({
      bookId: book._id,
      studentId: student._id,
      issueDate,
      dueDate,
      returnDate: null,
    });
    await tx.save();

    // Update book inventory fields
    book.issuedCount = (book.issuedCount || 0) + 1;
    book.availability = book.issuedCount < (book.totalQuantity || 0);
    book.dueDate = dueDate;
    await book.save();

    // Update student fields
    const cur = new Set((student.currentBooks || []).map(x => String(x)));
    cur.add(String(book._id));
    student.currentBooks = Array.from(cur);
    student.booksBorrowedCount = (student.booksBorrowedCount || 0) + 1;
    student.overdueBooksCount = (student.overdueBooksCount || 0) + 1;
    await student.save({ validateBeforeSave: false });

    console.log('Created overdue transaction:', {
      transactionId: tx._id.toString(),
      studentId: student._id.toString(),
      bookId: book._id.toString(),
      dueDate: dueDate.toISOString(),
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating overdue transaction:', err?.message || err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
})();
