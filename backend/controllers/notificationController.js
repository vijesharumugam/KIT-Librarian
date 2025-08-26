const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const NotificationLog = require('../models/NotificationLog');

// GET /api/student/notifications
// Returns recent notifications for the authenticated student
// Combines:
// - Borrow/Return events from Transactions
// - Due soon / Overdue reminders from NotificationLog
// Response shape: [{ type, title, message, at, meta }]
async function getStudentNotifications(req, res) {
  try {
    const studentId = req.student?._id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    const now = new Date();
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days

    // Borrow/Return events (limit)
    const txs = await Transaction.find({ studentId })
      .select('bookId issueDate returnDate dueDate createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const bookIds = [...new Set(txs.map(t => String(t.bookId)))];
    const books = await Book.find({ _id: { $in: bookIds } }).select('title author').lean();
    const bookMap = new Map(books.map(b => [String(b._id), b]));

    const txNotifs = [];
    for (const t of txs) {
      const book = bookMap.get(String(t.bookId));
      if (t.issueDate) {
        txNotifs.push({
          type: 'borrow',
          title: 'Book borrowed',
          message: `${book ? book.title : 'A book'}${book?.author ? ` by ${book.author}` : ''} borrowed. Due: ${t.dueDate ? new Date(t.dueDate).toDateString() : 'N/A'}`,
          at: t.issueDate,
          meta: { bookId: t.bookId, dueDate: t.dueDate },
        });
      }
      if (t.returnDate) {
        txNotifs.push({
          type: 'return',
          title: 'Book returned',
          message: `${book ? book.title : 'A book'} returned on ${new Date(t.returnDate).toDateString()}.`,
          at: t.returnDate,
          meta: { bookId: t.bookId },
        });
      }
    }

    // Reminders from NotificationLog (last 30 days)
    const logs = await NotificationLog.find({ studentId, sentAt: { $gt: since } })
      .select('type sentAt transactionId')
      .sort({ sentAt: -1 })
      .lean();

    const reminderNotifs = logs.map(l => ({
      type: l.type === 'overdue' ? 'overdue' : 'dueSoon',
      title: l.type === 'overdue' ? 'Overdue reminder' : 'Due soon reminder',
      message: l.type === 'overdue' ? 'You have an overdue book.' : 'A borrowed book is due soon.',
      at: l.sentAt,
      meta: { transactionId: l.transactionId },
    }));

    const clearedAt = req.student?.lastNotificationsClearedAt ? new Date(req.student.lastNotificationsClearedAt) : null;
    const items = [...txNotifs, ...reminderNotifs]
      .filter(Boolean)
      .filter(n => !clearedAt || new Date(n.at) > clearedAt)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 50);

    const lastReadAt = req.student?.lastNotificationsReadAt || null;
    const lastClearedAt = req.student?.lastNotificationsClearedAt || null;
    res.json({ items, lastReadAt, lastClearedAt });
  } catch (err) {
    console.error('getStudentNotifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/student/notifications/read
// Marks all notifications as read for the authenticated student by updating lastNotificationsReadAt
async function markStudentNotificationsRead(req, res) {
  try {
    const student = req.student;
    if (!student) return res.status(401).json({ message: 'Unauthorized' });
    student.lastNotificationsReadAt = new Date();
    await student.save({ validateBeforeSave: false });
    res.json({ ok: true, lastReadAt: student.lastNotificationsReadAt });
  } catch (err) {
    console.error('markStudentNotificationsRead error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/student/notifications/clear
// Clears all notifications (by timestamp), effectively hiding older events
async function clearStudentNotifications(req, res) {
  try {
    const student = req.student;
    if (!student) return res.status(401).json({ message: 'Unauthorized' });
    const now = new Date();
    student.lastNotificationsClearedAt = now;
    // Also mark as read to reset badges
    student.lastNotificationsReadAt = now;
    await student.save({ validateBeforeSave: false });
    res.json({ ok: true, lastClearedAt: student.lastNotificationsClearedAt, lastReadAt: student.lastNotificationsReadAt });
  } catch (err) {
    console.error('clearStudentNotifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getStudentNotifications, markStudentNotificationsRead, clearStudentNotifications };
