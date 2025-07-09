// Enhanced global error handling middleware for production
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (with request ID if available)
  const requestId = req.id || 'unknown';
  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = {
      message,
      statusCode: 404
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value for field '${field}': ${value}. Please use another value.`;
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    const message = `Validation Error: ${messages.join(', ')}`;
    error = {
      message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token. Please login again.';
    error = {
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired. Please login again.';
    error = {
      message,
      statusCode: 401
    };
  }

  // Express validator errors
  if (err.type === 'validation') {
    const message = 'Invalid input data provided';
    error = {
      message,
      statusCode: 400
    };
  }

  // Rate limiting errors
  if (err.type === 'rate-limit') {
    const message = 'Too many requests. Please try again later.';
    error = {
      message,
      statusCode: 429
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large. Maximum allowed size is 10MB.';
    error = {
      message,
      statusCode: 413
    };
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    const message = 'Cross-origin request blocked. This origin is not allowed.';
    error = {
      message,
      statusCode: 403
    };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError') {
    const message = 'Database connection error. Please try again later.';
    error = {
      message,
      statusCode: 503
    };
  }

  // Prepare response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    requestId,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.originalError = err.name;
  }

  // Add error code for client handling
  if (statusCode >= 400 && statusCode < 500) {
    response.type = 'client_error';
  } else if (statusCode >= 500) {
    response.type = 'server_error';
  }

  res.status(statusCode).json(response);
};

// Enhanced 404 handler
const notFound = (req, res, next) => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  const error = new Error(message);
  error.statusCode = 404;
  
  // Log 404 for monitoring
  console.warn(`[404] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  next(error);
};

// Enhanced async handler wrapper with better error context
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Add request context to error
    error.requestContext = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id
    };
    next(error);
  });
};

// Validation error handler for express-validator
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Global error monitoring function
const setupErrorMonitoring = () => {
  // Track unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to send this to a monitoring service
  });

  // Track uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // In production, you might want to send this to a monitoring service
    process.exit(1);
  });
};

module.exports = { 
  errorHandler, 
  notFound, 
  asyncHandler, 
  handleValidationErrors,
  setupErrorMonitoring 
};
