const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  syncCart
} = require('../controllers/cartController');
const { auth } = require('../middleware/auth');
const { 
  validate, 
  validateCartItem, 
  commonValidations 
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting for cart operations
const cartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 cart operations per minute
  message: {
    success: false,
    message: 'Too many cart operations, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all cart routes
router.use(cartLimiter);

// Cart routes - All require authentication
router.get('/', auth, getCart);
router.get('/count', auth, getCartCount);
router.post('/add', validateCartItem, validate, auth, addToCart);
router.put('/update', validateCartItem, validate, auth, updateCartItem);
router.post('/sync', validate, auth, syncCart);
router.delete('/remove/:productId', commonValidations.mongoId, validate, auth, removeFromCart);
router.delete('/clear', auth, clearCart);

module.exports = router;
