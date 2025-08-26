const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent, logoutStudent, getCurrentStudent, getProfile, updateProfile } = require('../controllers/studentController');
const { verifyStudent } = require('../middleware/authMiddleware');
const { getStudentNotifications, markStudentNotificationsRead, clearStudentNotifications } = require('../controllers/notificationController');

// Password-based student auth routes
router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.get('/current', verifyStudent, getCurrentStudent);
router.post('/logout', logoutStudent);
router.get('/profile', verifyStudent, getProfile);
router.put('/profile', verifyStudent, updateProfile);
// Student notifications
router.get('/notifications', verifyStudent, getStudentNotifications);
router.post('/notifications/read', verifyStudent, markStudentNotificationsRead);
router.post('/notifications/clear', verifyStudent, clearStudentNotifications);

module.exports = router;
