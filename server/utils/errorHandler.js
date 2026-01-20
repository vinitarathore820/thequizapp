const { validationResult } = require('express-validator');
const logger = require('./logger');

// Custom error handler class
exports.ErrorResponse = class ErrorResponse extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
};

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(err.details && { details: err.details }),
  };

  // Log the error
  logger.error(
    `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );

  if (err.stack) {
    logger.error(err.stack);
  }

  res.status(statusCode).json(errorResponse);
};

// Async handler to wrap async/await routes
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
exports.validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errorMessages,
    });
  }
  next();
};
