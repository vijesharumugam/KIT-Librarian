const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
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
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  currentBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  // Persistent counters for quick dashboard stats
  booksBorrowedCount: { type: Number, default: 0 },
  overdueBooksCount: { type: Number, default: 0 },
  // Data retention and privacy
  analyticsConsent: { type: Boolean, default: false },
  anonymizedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Hash password before saving if modified
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password helper
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
