const express = require('express');
const { loginAdmin, getStats } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/admin/login
router.post('/login', loginAdmin);

// GET /api/admin/stats
router.get('/stats', authMiddleware, getStats);

module.exports = router;
