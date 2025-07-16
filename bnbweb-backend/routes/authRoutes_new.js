const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  logout,
  logoutAll,
  getMe,
  changePassword
} = require('../controllers/authController');
const { auth, userRateLimit, requireEmailVerification, securityHeaders } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Apply security headers to all routes
router.use(securityHeaders);

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for sensitive operations
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // Allow more login attempts than other auth operations
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // 2 OTP requests per minute (stricter)
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please enter a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Please select a valid gender')
];

const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isLength({ max: 255 })
    .withMessage('Email is too long'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password is too long'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be true or false')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
];

const verifyOtpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits')
];

const resetPasswordValidation = [
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
    .isLength({ max: 128 })
    .withMessage('Current password is too long'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Public Authentication Routes
router.post('/register', 
  authLimiter, 
  registerValidation, 
  validate, 
  register
);

router.post('/login', 
  loginLimiter, 
  loginValidation, 
  validate, 
  login
);

// Password Reset Routes (Public)
router.post('/forgot-password', 
  passwordResetLimiter, 
  forgotPasswordValidation, 
  validate, 
  forgotPassword
);

router.post('/verify-otp', 
  otpLimiter, 
  verifyOtpValidation, 
  validate, 
  verifyOTP
);

router.post('/reset-password', 
  authLimiter, 
  resetPasswordValidation, 
  validate, 
  resetPassword
);

// Protected Routes (Require Authentication)
router.use(auth); // Apply auth middleware to all routes below

router.get('/me', 
  userRateLimit(50), // 50 requests per 15 minutes for profile access
  getMe
);

router.put('/change-password', 
  authLimiter, 
  changePasswordValidation, 
  validate, 
  changePassword
);

router.post('/logout', 
  userRateLimit(10), // 10 logout requests per 15 minutes
  logout
);

router.post('/logout-all', 
  authLimiter, // More restrictive for security
  logoutAll
);

module.exports = router;
