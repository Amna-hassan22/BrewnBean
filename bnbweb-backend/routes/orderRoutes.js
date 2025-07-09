const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getAllOrders,
  getOrdersByStatus,
  updateOrderTracking
} = require('../controllers/orderController');
const { auth, adminAuth, resourceOwnership } = require('../middleware/auth');
const { 
  validate, 
  validateOrderCreation, 
  validatePagination,
  commonValidations 
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Rate limiting for order creation
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 orders per minute
  message: {
    success: false,
    message: 'Too many orders placed, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Additional validation rules
const updateStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Valid status is required'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note cannot exceed 200 characters')
];

const cancelOrderValidation = [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Cancellation reason must be between 5 and 200 characters')
];

const trackingValidation = [
  body('carrier')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  body('trackingUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid tracking URL')
];

// Admin routes
router.get('/admin/all', auth, adminAuth, validatePagination, validate, getAllOrders);
router.get('/admin/stats', auth, adminAuth, getOrderStats);
router.get('/admin/status/:status', auth, adminAuth, validatePagination, validate, getOrdersByStatus);
router.put('/:id/status', commonValidations.mongoId, updateStatusValidation, validate, auth, adminAuth, updateOrderStatus);
router.put('/:id/tracking', commonValidations.mongoId, trackingValidation, validate, auth, adminAuth, updateOrderTracking);

// Customer routes
router.post('/', orderLimiter, validateOrderCreation, validate, auth, createOrder);
router.get('/', validatePagination, validate, auth, getUserOrders);
router.get('/:id', commonValidations.mongoId, validate, auth, getOrder);
router.put('/:id/cancel', commonValidations.mongoId, cancelOrderValidation, validate, auth, cancelOrder);

module.exports = router;
