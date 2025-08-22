const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  // OTP login support
  otpCode: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  // For demo: persist last issued token. In production, prefer stateless JWT without storing.
  lastLoginToken: {
    type: String,
    default: null
  },
  currentBooks: [{
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
