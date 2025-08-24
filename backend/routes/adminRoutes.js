const express = require('express');
const multer = require('multer');
const { loginAdmin, getStats } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadBooksFromExcel } = require('../controllers/adminBooksUploadController');

const router = express.Router();

// POST /api/admin/login
router.post('/login', loginAdmin);

// GET /api/admin/stats
router.get('/stats', authMiddleware, getStats);

// File upload setup (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    // allow by extension fallback
    if (/\.xlsx$|\.csv$/i.test(file.originalname)) return cb(null, true);
    return cb(new Error('Only .xlsx or .csv files are allowed'));
  },
});

// POST /api/admin/books/upload
router.post('/books/upload', authMiddleware, upload.single('file'), uploadBooksFromExcel);

module.exports = router;
