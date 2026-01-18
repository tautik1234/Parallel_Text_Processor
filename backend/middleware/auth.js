const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// Authentication middleware - MUST BE ASYNC
const authenticateToken = async (req, res, next) => {  // ← ADD 'async' HERE
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token after "Bearer"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // ✅ Check if user exists and is not deleted
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found'
      });
    }
    
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deleted. Please contact support.'
      });
    }
    
    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: user.name  // Optional: Add name if needed
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or malformed token' 
      });
    }
    
    // Handle any other errors
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

module.exports = {
  authenticateToken,
  generateToken
};