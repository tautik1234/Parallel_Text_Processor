const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const User = require('../models/User'); // Import User model

/**
 * Register new user - WITH MONGODB
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOneActive({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user - password will be hashed by pre-save hook
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: password // Will be hashed automatically
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id.toString(), newUser.email);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

/**
 * Login user - WITH MONGODB
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user in MongoDB
    const user = await User.findOneActive({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password using model method
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * Get user profile - WITH MONGODB
 */
const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { userId } = req.user;
    
    // Find user in MongoDB, exclude passwordHash
    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

/**
 * Logout user
 */
const logout = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userEmail = req.user.email || 'unknown user';
    logger.info(`User logged out: ${userEmail}`);
    
    // In a production app, you might want to invalidate the token
    // For now, we just log the logout
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Update user profile - WITH MONGODB
 */
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, email } = req.body;

    // Validate at least one field is provided
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or email) is required for update'
      });
    }

    // Check if new email already exists (if email is being updated)
    if (email) {
      const existingUser = await User.findOneActive({ 
  email: email.toLowerCase(),
  _id: { $ne: userId }
});
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
    }

    // Build update object
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    
    // Update user in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    ).select('-passwordHash'); // Exclude password hash

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User profile updated: ${userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change user password - WITH MONGODB
 */
const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Find user with password hash
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (pre-save hook will hash it)
    user.passwordHash = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${userId}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * Delete user account (Soft Delete) - WITH MONGODB
 */
const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { confirmation } = req.body;

    // Require confirmation
    if (!confirmation || confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Send { "confirmation": "DELETE" } to delete account.'
      });
    }

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete: Mark as deleted instead of removing
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Optionally: Anonymize user data
    // user.name = 'Deleted User';
    // user.email = `deleted_${userId}@deleted.com`;
    // await user.save();

    logger.info(`User account soft deleted: ${userId} (${user.email})`);

    // Note: We're NOT deleting user's processing jobs
    // They remain in database with userId reference
    // In production, you might want to:
    // 1. Delete all user's jobs (cascade delete)
    // 2. Anonymize the jobs
    // 3. Keep them for analytics
    
    // For now, we just soft delete the user account

    res.json({
      success: true,
      message: 'Account deleted successfully. Your data will be permanently removed after 30 days.',
      data: {
        deletionDate: new Date().toISOString(),
        dataRetention: 'Processing jobs and history will be retained for 30 days'
      }
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

/**
 * Reactivate deleted account - WITH MONGODB
 */
const reactivateAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user including deleted ones
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isDeleted: true // Only look for deleted accounts
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No deleted account found with this email'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reactivate account
    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    // Generate new token
    const token = generateToken(user._id.toString(), user.email);

    logger.info(`User account reactivated: ${user._id}`);

    res.json({
      success: true,
      message: 'Account reactivated successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Reactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate account'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,      // ADD THIS
  changePassword,     // ADD THIS
  deleteAccount,      // ADD THIS
  reactivateAccount   // ADD THIS
};