const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    default: 1,
    min: 0,
  },
  issuedCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  availability: {
    type: Boolean,
    default: true
  },
  dueDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);
