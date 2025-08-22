const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { borrowBook, returnBook } = require('../controllers/transactionsController');

// Protect all transaction routes with admin auth
router.post('/borrow', authMiddleware, borrowBook);
router.post('/return', authMiddleware, returnBook);

module.exports = router;
