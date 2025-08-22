const mongoose = require('mongoose');

const checkMongoDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/kit-librarian', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB is running and accessible on port 27017');
    console.log('🔗 Connected to database: kit-librarian');
    mongoose.connection.close();
  } catch (error) {
    console.log('❌ MongoDB connection failed:');
    console.log('Error:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Make sure MongoDB service is running');
    console.log('2. Check if MongoDB is installed');
    console.log('3. Verify port 27017 is not blocked');
  }
};

checkMongoDB();
