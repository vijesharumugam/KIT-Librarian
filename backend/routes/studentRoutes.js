const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtp, getCurrentStudent } = require('../controllers/studentController');
const studentAuth = require('../middleware/studentAuth');

// Student OTP login routes
router.post('/login', requestOtp); // request OTP
router.post('/verify', verifyOtp); // verify OTP and get JWT
// current student borrowed books
router.get('/current', studentAuth, getCurrentStudent);

module.exports = router;
