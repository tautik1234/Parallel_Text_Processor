const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    // Remove deprecated options - Mongoose 6+ doesn't need them
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    
    // Don't exit immediately - log and try to continue
    logger.warn('⚠️  Continuing without database connection');
    
    // In production, you might want different behavior
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;