require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Automatically create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Created uploads directory at: ${uploadDir}`);
}

// Import database connection
const connectDB = require('./config/database');
const mongoose=require('mongoose');

// Import routes
const authRoutes = require('./routes/auth.routes');
const textRoutes = require('./routes/text.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const historyRoutes = require('./routes/history.routes');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { logger } = require('./utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  }[dbStatus] || 'Unknown';
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Parallel Text Processor API',
    database: dbStatusText
  });
});

// Add to server.js or create new route
app.get('/api/python-health', async (req, res) => {
  try {
    const pythonService = require('./services/python-integration.service');
    const pythonStatus = await pythonService.testConnection();
    
    res.json({
      success: true,
      nodejs: {
        status: 'running',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      python: pythonStatus,
      integrated: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/text', authenticateToken, textRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/history', authenticateToken, historyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 API Documentation available at http://localhost:${PORT}/api/health`);
});

module.exports = app;
