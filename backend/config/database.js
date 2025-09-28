const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('💡 Please check your MongoDB Atlas connection string in .env file');
    console.log('💡 Make sure your MongoDB Atlas cluster is running and accessible');
    process.exit(1);
  }
};

module.exports = connectDB;
