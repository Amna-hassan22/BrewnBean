const { validationResult, body, param, query } = require('express-validator');
const { sendError } = require('../utils/helpers');

// Enhanced validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return sendError(res, 'Validation failed', 400, { errors: errorMessages });
  }
  
  next();
};

// Sanitize user input
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string values in req.body
  const sanitize = (obj) => {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        obj[key] = obj[key].replace(/javascript:/gi, '');
        obj[key] = obj[key].replace(/on\w+=/gi, '');
        obj[key] = obj[key].trim();
      } else if (obj[key] && typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) {
    sanitize(req.body);
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  phone: body('phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits'),
    
  mongoId: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
    
  positiveNumber: (field) => body(field)
    .isFloat({ min: 0 })
    .withMessage(`${field} must be a positive number`),
    
  requiredString: (field, min = 1, max = 100) => body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`)
};

// Product validation rules
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('category')
    .isIn(['coffee', 'tea', 'chocolate', 'cookies', 'equipment', 'merchandise'])
    .withMessage('Invalid category'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('sku')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),
  body('images.*.url')
    .isURL()
    .withMessage('Invalid image URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters')
];

// Order validation rules
const validateOrderCreation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('shippingAddress.phone')
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('shippingAddress.postalCode')
    .matches(/^[0-9]{6}$/)
    .withMessage('Please enter a valid 6-digit postal code'),
  body('paymentMethod')
    .isIn(['cash_on_delivery', 'card', 'upi', 'net_banking', 'wallet'])
    .withMessage('Invalid payment method')
];

// Cart validation rules
const validateCartItem = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10')
];

// Review validation rules
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Search validation
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category')
    .optional()
    .isIn(['coffee', 'tea', 'chocolate', 'cookies', 'equipment', 'merchandise'])
    .withMessage('Invalid category'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
];

module.exports = { 
  validate,
  sanitizeInput,
  commonValidations,
  validateProductCreation,
  validateOrderCreation,
  validateCartItem,
  validateReview,
  validatePagination,
  validateSearch
};
