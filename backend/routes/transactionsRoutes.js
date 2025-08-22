const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { borrowBook, returnBook, listIssued, returnById, listOverdue } = require('../controllers/transactionsController');

// Protect all transaction routes with admin auth
router.post('/borrow', authMiddleware, borrowBook);
router.post('/return', authMiddleware, returnBook);
router.get('/issued', authMiddleware, listIssued);
router.put('/return/:id', authMiddleware, returnById);
router.get('/overdue', authMiddleware, listOverdue);

module.exports = router;
