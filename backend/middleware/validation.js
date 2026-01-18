const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => err.msg) // Map to simple array of strings
    });
  }
  next();
};

// Validation rules for auth routes
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
  
  // REMOVED: confirmPassword check (Frontend handles this)
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for text processing
const validateProcessText = [
  body('text')
    .notEmpty() // Changed to notEmpty() because the controller requires it
    .isString()
    .withMessage('Text is required and must be a string'),
    
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProcessText,
  handleValidationErrors
};