const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const Book = require('../models/Book');
const { sendMail } = require('../utils/mailer');
const { config } = require('../config/env');
const NotificationLog = require('../models/NotificationLog');

function groupBy(arr, keyFn) {
  return arr.reduce((map, item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
    return map;
  }, new Map());
}

function formatDate(d) {
  try { return new Date(d).toDateString(); } catch { return String(d); }
}

function renderEmail({ student, dueSoonItems, overdueItems }) {
  const lines = [];
  lines.push(`Hello ${student.name},`);
  if (dueSoonItems.length) {
    lines.push('\nThe following books are due soon:');
    for (const it of dueSoonItems) {
      lines.push(`- ${it.book.title} by ${it.book.author} (Due: ${formatDate(it.tx.dueDate)})`);
    }
  }
  if (overdueItems.length) {
    lines.push('\nThe following books are overdue:');
    for (const it of overdueItems) {
      lines.push(`- ${it.book.title} by ${it.book.author} (Due: ${formatDate(it.tx.dueDate)})`);
    }
  }
  lines.push('\nPlease return or renew them at your earliest convenience.');
  lines.push('\n— Kit Librarian');
  const text = lines.join('\n');
  // simple HTML version
  const html = `<p>Hello ${student.name},</p>` +
    (dueSoonItems.length ? `<p>The following books are due soon:</p><ul>` + dueSoonItems.map(it => `<li>${it.book.title} by ${it.book.author} (Due: ${formatDate(it.tx.dueDate)})</li>`).join('') + `</ul>` : '') +
    (overdueItems.length ? `<p>The following books are overdue:</p><ul>` + overdueItems.map(it => `<li>${it.book.title} by ${it.book.author} (Due: ${formatDate(it.tx.dueDate)})</li>`).join('') + `</ul>` : '') +
    `<p>Please return or renew them at your earliest convenience.</p><p>— Kit Librarian</p>`;
  const subject = `${overdueItems.length ? 'Overdue' : 'Upcoming due'} library books`;
  return { subject, text, html };
}

async function buildReminderBatches(now = new Date()) {
  const start = new Date(now);
  const soonEnd = new Date(now.getTime() + config.DUE_SOON_DAYS * 24 * 60 * 60 * 1000);

  const active = await Transaction.find({ returnDate: null })
    .select('bookId studentId issueDate dueDate returnDate')
    .lean();

  if (!active.length) return [];

  // Prefetch referenced docs
  const bookIds = [...new Set(active.map(a => String(a.bookId)))];
  const studentIds = [...new Set(active.map(a => String(a.studentId)))];
  const [books, students] = await Promise.all([
    Book.find({ _id: { $in: bookIds } }).select('title author').lean(),
    Student.find({ _id: { $in: studentIds } }).select('name email').lean(),
  ]);
  const bookMap = new Map(books.map(b => [String(b._id), b]));
  const studentMap = new Map(students.map(s => [String(s._id), s]));

  // Classify by student
  const byStudent = groupBy(active, tx => String(tx.studentId));
  const batches = [];
  for (const [studentId, txs] of byStudent.entries()) {
    const student = studentMap.get(studentId);
    if (!student || !student.email) continue; // skip if no email
    const dueSoonItems = [];
    const overdueItems = [];
    for (const tx of txs) {
      const book = bookMap.get(String(tx.bookId));
      if (!book) continue;
      const due = new Date(tx.dueDate);
      if (due < now) {
        overdueItems.push({ tx, book });
      } else if (due >= start && due < soonEnd) {
        dueSoonItems.push({ tx, book });
      }
    }
    if (!dueSoonItems.length && !overdueItems.length) continue;
    batches.push({ student, dueSoonItems, overdueItems });
  }
  return batches;
}

async function sendReminders(logger = console) {
  const now = new Date();
  const batches = await buildReminderBatches(now);
  // Idempotency window: 24 hours
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  // Collect all transactionIds from all batches for quick log lookup
  const allItems = [];
  for (const b of batches) {
    for (const it of b.dueSoonItems) allItems.push({ txId: String(it.tx._id), type: 'dueSoon' });
    for (const it of b.overdueItems) allItems.push({ txId: String(it.tx._id), type: 'overdue' });
  }
  const uniqueKeys = [...new Set(allItems.map(i => `${i.txId}|${i.type}`))];
  let recentMap = new Map();
  if (uniqueKeys.length) {
    const txIds = [...new Set(allItems.map(i => i.txId))];
    const logs = await NotificationLog.find({ transactionId: { $in: txIds }, sentAt: { $gt: cutoff } })
      .select('transactionId type sentAt')
      .lean();
    recentMap = new Map(logs.map(l => [`${String(l.transactionId)}|${l.type}`, l]));
  }
  let sent = 0; let skipped = 0;
  for (const b of batches) {
    // Filter out items that were notified within the window
    const dueSoonToSend = b.dueSoonItems.filter(it => !recentMap.has(`${String(it.tx._id)}|dueSoon`));
    const overdueToSend = b.overdueItems.filter(it => !recentMap.has(`${String(it.tx._id)}|overdue`));
    if (!dueSoonToSend.length && !overdueToSend.length) { skipped++; continue; }
    try {
      const { subject, text, html } = renderEmail({ student: b.student, dueSoonItems: dueSoonToSend, overdueItems: overdueToSend });
      const res = await sendMail({ to: b.student.email, subject, text, html });
      if (res && res.skipped) { skipped++; continue; }
      sent++;
      // Log notifications for idempotency
      const docs = [
        ...dueSoonToSend.map(it => ({ studentId: b.student._id, transactionId: it.tx._id, type: 'dueSoon', sentAt: new Date() })),
        ...overdueToSend.map(it => ({ studentId: b.student._id, transactionId: it.tx._id, type: 'overdue', sentAt: new Date() })),
      ];
      if (docs.length) await NotificationLog.insertMany(docs, { ordered: false });
    } catch (e) {
      logger.warn('[Notifications] Failed to send to', b.student.email, e?.message || e);
    }
  }
  return { sent, skipped, total: batches.length };
}

module.exports = { sendReminders, buildReminderBatches, renderEmail };
