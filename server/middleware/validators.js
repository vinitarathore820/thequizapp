const { body, validationResult } = require('express-validator');
const { validationHandler } = require('../utils/errorHandler');

// Password validation rules
const passwordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
];

// Email validation rules
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

// Register validation rules
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  ...emailValidation,
  ...passwordValidation,
  validationHandler,
];

// Login validation rules
exports.validateLogin = [
  ...emailValidation,
  body('password').notEmpty().withMessage('Password is required'),
  validationHandler,
];

// Forgot password validation rules
exports.validateForgotPassword = [
  ...emailValidation,
  validationHandler,
];

// Reset password validation rules
exports.validateResetPassword = [
  ...emailValidation,
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  ...passwordValidation,
  validationHandler,
];
