const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

// Use the same MongoDB URI from your environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kit-librarian';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const admin = new Admin({
      username: 'admin',
      password: 'admin123' // This will be hashed automatically by the pre-save hook
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createAdmin();
