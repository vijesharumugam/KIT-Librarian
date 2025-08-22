const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent, logoutStudent, getCurrentStudent } = require('../controllers/studentController');
const { verifyStudent } = require('../middleware/authMiddleware');

// Password-based student auth routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/current', verifyStudent, getCurrentStudent);
router.post('/logout', logoutStudent);

module.exports = router;
