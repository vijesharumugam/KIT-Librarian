const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  type: { type: String, enum: ['dueSoon', 'overdue'], required: true },
  sentAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, index: true });

notificationLogSchema.index({ studentId: 1, transactionId: 1, type: 1, sentAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
