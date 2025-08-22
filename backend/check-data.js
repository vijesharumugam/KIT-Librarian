const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');
const Book = require('./models/Book');
const Student = require('./models/Student');
const Admin = require('./models/Admin');

const checkData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB Atlas');
    
    const bookCount = await Book.countDocuments();
    const studentCount = await Student.countDocuments();
    const adminCount = await Admin.countDocuments();
    
    console.log('\n📊 Database Contents:');
    console.log(`📚 Books: ${bookCount}`);
    console.log(`👥 Students: ${studentCount}`);
    console.log(`👤 Admins: ${adminCount}`);
    
    if (bookCount > 0) {
      console.log('\n📖 Sample Books:');
      const sampleBooks = await Book.find().limit(5);
      sampleBooks.forEach((book, index) => {
        console.log(`${index + 1}. ${book.title} by ${book.author}`);
      });
    }
    
    if (studentCount > 0) {
      console.log('\n👨‍🎓 Sample Students:');
      const sampleStudents = await Student.find().limit(5);
      sampleStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.registerNumber} - ${student.phoneNumber}`);
      });
    }
    
    mongoose.connection.close();
    console.log('\n✅ Data check complete!');
    
  } catch (error) {
    console.error('Error checking data:', error.message);
  }
};

checkData();
