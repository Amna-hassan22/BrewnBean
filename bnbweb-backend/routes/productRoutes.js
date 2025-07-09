const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  getPopularProducts,
  addProductReview,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');
const { auth, optionalAuth, adminAuth } = require('../middleware/auth');
const { 
  validate, 
  sanitizeInput, 
  validateProductCreation,
  validateReview,
  validatePagination,
  validateSearch,
  commonValidations
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting for reviews
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reviews per hour per user
  message: {
    success: false,
    message: 'Too many reviews submitted, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for search
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/', validatePagination, validateSearch, validate, optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/popular', getPopularProducts);
router.get('/search/:query', searchLimiter, validateSearch, validate, searchProducts);
router.get('/category/:category', validatePagination, validate, getProductsByCategory);
router.get('/:id', commonValidations.mongoId, validate, optionalAuth, getProduct);

// Protected routes - Customer
router.post('/:id/reviews', reviewLimiter, commonValidations.mongoId, validateReview, validate, sanitizeInput, auth, addProductReview);

// Protected routes - Admin only
router.get('/admin/stats', auth, adminAuth, getProductStats);
router.post('/', validateProductCreation, validate, sanitizeInput, auth, adminAuth, createProduct);
router.put('/:id', commonValidations.mongoId, validateProductCreation, validate, sanitizeInput, auth, adminAuth, updateProduct);
router.delete('/:id', commonValidations.mongoId, validate, auth, adminAuth, deleteProduct);

module.exports = router;
