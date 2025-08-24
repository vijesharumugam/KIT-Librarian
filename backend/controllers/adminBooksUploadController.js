const XLSX = require('xlsx');
const Book = require('../models/Book');

// Required columns in the spreadsheet
const REQUIRED_COLUMNS = ['title', 'author', 'isbn', 'quantity'];

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase();
}

function extractRowsFromWorkbook(workbook) {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return json;
}

async function upsertBooks(rows) {
  let inserted = 0;
  let updated = 0;

  for (const r of rows) {
    const title = String(r.title || '').trim();
    const author = String(r.author || '').trim();
    const isbn = String(r.isbn || '').trim();
    const qtyRaw = r.quantity;
    const quantity = Number.parseInt(qtyRaw, 10);

    if (!title || !author || !isbn || Number.isNaN(quantity) || quantity < 0) {
      // skip invalid row
      continue;
    }

    const existing = await Book.findOne({ isbn });
    if (existing) {
      existing.totalQuantity = (existing.totalQuantity || 0) + quantity;
      await existing.save();
      updated += 1;
    } else {
      await Book.create({ title, author, isbn, totalQuantity: quantity, issuedCount: 0, availability: true });
      inserted += 1;
    }
  }
  return { inserted, updated };
}

// Controller: handle file upload and parse
const uploadBooksFromExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const rowsRaw = extractRowsFromWorkbook(workbook);

    if (!rowsRaw || rowsRaw.length === 0) {
      return res.status(400).json({ message: 'Uploaded file is empty or unreadable' });
    }

    // Validate headers contain required columns
    const headers = Object.keys(rowsRaw[0] || {}).map(normalizeHeader);
    const hasAll = REQUIRED_COLUMNS.every((col) => headers.includes(col));
    if (!hasAll) {
      return res.status(400).json({ message: `Missing required columns. Required: ${REQUIRED_COLUMNS.join(', ')}` });
    }

    // Normalize row keys to required columns only
    const rows = rowsRaw.map((r) => {
      const obj = {};
      for (const col of REQUIRED_COLUMNS) {
        // try to map case-insensitive
        const matchKey = Object.keys(r).find((k) => normalizeHeader(k) === col);
        obj[col] = matchKey ? r[matchKey] : '';
      }
      return obj;
    });

    const result = await upsertBooks(rows);

    return res.json({
      message: 'Upload processed',
      inserted: result.inserted,
      updated: result.updated,
      totalRows: rows.length,
    });
  } catch (err) {
    console.error('Upload parse error:', err);
    return res.status(500).json({ message: 'Server error while processing file' });
  }
};

module.exports = {
  uploadBooksFromExcel,
};
