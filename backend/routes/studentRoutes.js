const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent, logoutStudent, getCurrentStudent, getProfile, updateProfile } = require('../controllers/studentController');
const { verifyStudent } = require('../middleware/authMiddleware');

// Password-based student auth routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/current', verifyStudent, getCurrentStudent);
router.post('/logout', logoutStudent);
router.get('/profile', verifyStudent, getProfile);
router.put('/profile', verifyStudent, updateProfile);

module.exports = router;
