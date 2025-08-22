const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kit-librarian', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const booksRoutes = require('./routes/booksRoutes');
const transactionsRoutes = require('./routes/transactionsRoutes');
const studentsController = require('./controllers/studentsController');
const authMiddleware = require('./middleware/authMiddleware');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Kit Librarian API is running!' });
});

// Use admin routes
app.use('/api/admin', adminRoutes);
// Use student routes
app.use('/api/student', studentRoutes);
// Use books routes
app.use('/api/books', booksRoutes);
// Use transactions routes
app.use('/api/transactions', transactionsRoutes);
// Simple students list route (admin only)
app.get('/api/students', authMiddleware, studentsController.listStudents);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
