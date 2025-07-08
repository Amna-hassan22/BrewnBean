const express = require('express');
const {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
  getPopularProducts,
  addProductReview,
  searchProducts
} = require('../controllers/productController');
const { auth, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// Routes
router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/popular', getPopularProducts);
router.get('/search/:query', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', optionalAuth, getProduct);
router.post('/:id/reviews', auth, reviewValidation, addProductReview);

module.exports = router;
