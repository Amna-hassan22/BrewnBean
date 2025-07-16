const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/helpers');
const emailService = require('../utils/emailService');

// Security Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour
const MAX_OTP_ATTEMPTS = 3;
const BCRYPT_ROUNDS = 12;

// Generate secure OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate secure reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash password with high salt rounds
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  return null;
};

// Check account lockout
const checkAccountLockout = (user) => {
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const timeLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return { locked: true, timeLeft };
  }
  return { locked: false };
};

// Handle failed login attempt
const handleFailedLogin = async (user) => {
  if (!user.loginAttempts) {
    user.loginAttempts = 0;
  }
  
  user.loginAttempts += 1;
  
  if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    user.lockUntil = Date.now() + LOCKOUT_TIME;
  }
  
  await user.save();
  return user.loginAttempts;
};

// Handle successful login
const handleSuccessfulLogin = async (user, ipAddress, userAgent) => {
  // Reset login attempts and lockout
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }
  
  // Update last login info
  user.lastLogin = new Date();
  user.loginIP = ipAddress;
  
  // Clean up old invalidated tokens
  user.cleanupInvalidatedTokens();
  
  // Add session info
  const tokenId = crypto.randomUUID();
  user.activeSessions.push({
    tokenId,
    deviceInfo: userAgent || 'Unknown Device',
    ipAddress,
    lastActivity: new Date()
  });
  
  // Keep only last 5 sessions
  if (user.activeSessions.length > 5) {
    user.activeSessions = user.activeSessions.slice(-5);
  }
  
  await user.save();
  return tokenId;
};

// Generate JWT with additional claims
const generateSecureToken = (userId, tokenId) => {
  return jwt.sign(
    { 
      id: userId,
      tokenId,
      iat: Math.floor(Date.now() / 1000)
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'brewbean-api',
      audience: 'brewbean-client'
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dateOfBirth, gender } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return sendError(res, 'Name, email, and password are required', 400);
  }

  // Validate password strength
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return sendError(res, passwordError, 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [
      { email: email.toLowerCase() },
      { phone: phone }
    ]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      return sendError(res, 'User with this email already exists', 409);
    }
    if (existingUser.phone === phone) {
      return sendError(res, 'User with this phone number already exists', 409);
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Get client IP
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: phone?.trim(),
    dateOfBirth,
    gender,
    registrationIP: ipAddress,
    isEmailVerified: process.env.NODE_ENV === 'development' // Auto-verify in dev
  });

  // Generate token
  const tokenId = crypto.randomUUID();
  const token = generateSecureToken(user._id, tokenId);

  // Add initial session
  user.activeSessions.push({
    tokenId,
    deviceInfo: req.get('User-Agent') || 'Unknown Device',
    ipAddress,
    lastActivity: new Date()
  });
  await user.save();

  // Prepare user data (exclude sensitive fields)
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    accountStatus: user.accountStatus
  };

  sendSuccess(res, 'User registered successfully', {
    user: userData,
    token
  }, 201);
});

// @desc    Login user with email/username and password
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Validate input
  if (!email || !password) {
    return sendError(res, 'Email and password are required', 400);
  }

  // Find user by email or username (case-insensitive)
  const user = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { name: { $regex: new RegExp(`^${email}$`, 'i') } }
    ]
  }).select('+password +loginAttempts +lockUntil +invalidatedTokens +activeSessions');

  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    return sendError(res, 'Account is inactive. Please contact support.', 403);
  }

  // Check account lockout
  const lockoutStatus = checkAccountLockout(user);
  if (lockoutStatus.locked) {
    return sendError(res, `Account is locked. Try again in ${lockoutStatus.timeLeft} minutes.`, 423);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const attemptsLeft = await handleFailedLogin(user);
    const remainingAttempts = MAX_LOGIN_ATTEMPTS - attemptsLeft;
    
    if (remainingAttempts <= 0) {
      return sendError(res, `Too many failed attempts. Account locked for ${LOCKOUT_TIME / 60000} minutes.`, 423);
    }
    
    return sendError(res, `Invalid email or password. ${remainingAttempts} attempts remaining.`, 401);
  }

  // Handle successful login
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const tokenId = await handleSuccessfulLogin(user, ipAddress, userAgent);

  // Generate JWT token
  const tokenExpiry = rememberMe ? '30d' : '7d';
  const token = jwt.sign(
    { id: user._id, tokenId },
    process.env.JWT_SECRET,
    { expiresIn: tokenExpiry }
  );

  // Prepare user data
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    lastLogin: user.lastLogin,
    accountStatus: user.accountStatus
  };

  sendSuccess(res, 'Login successful', {
    user: userData,
    token,
    expiresIn: tokenExpiry
  });
});

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'Email is required', 400);
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+otp +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    // Don't reveal if email exists or not for security
    return sendSuccess(res, 'If an account with that email exists, an OTP has been sent');
  }

  // Check if user has too many recent OTP attempts
  if (user.otp && user.otp.attempts >= MAX_OTP_ATTEMPTS) {
    const timeLeft = Math.ceil((user.otp.expires - Date.now()) / 60000);
    return sendError(res, `Too many OTP attempts. Please wait ${timeLeft} minutes before requesting again.`, 429);
  }

  // Generate OTP and reset token
  const otp = generateOTP();
  const resetToken = generateResetToken();
  const hashedOTP = await bcrypt.hash(otp, 8);

  // Save OTP and reset token
  user.otp = {
    code: hashedOTP,
    expires: new Date(Date.now() + OTP_EXPIRY),
    verified: false,
    attempts: (user.otp?.attempts || 0) + 1
  };
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

  await user.save();

  // Send OTP email
  try {
    await emailService.sendOTPEmail(user.email, otp, user.name);
    sendSuccess(res, 'OTP sent to your email address. Please check your inbox.');
  } catch (error) {
    // Clear OTP on email failure
    user.otp = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.error('Failed to send OTP email:', error);
    return sendError(res, 'Failed to send OTP. Please try again later.', 500);
  }
});

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return sendError(res, 'Email and OTP are required', 400);
  }

  // Find user with valid OTP
  const user = await User.findOne({
    email: email.toLowerCase(),
    'otp.expires': { $gt: Date.now() }
  }).select('+otp +resetPasswordToken');

  if (!user || !user.otp) {
    return sendError(res, 'Invalid or expired OTP', 400);
  }

  // Verify OTP
  const isOTPValid = await bcrypt.compare(otp, user.otp.code);
  if (!isOTPValid) {
    return sendError(res, 'Invalid OTP', 400);
  }

  // Mark OTP as verified
  user.otp.verified = true;
  await user.save();

  sendSuccess(res, 'OTP verified successfully', {
    resetToken: user.resetPasswordToken
  });
});

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return sendError(res, 'Reset token and new password are required', 400);
  }

  // Validate password strength
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return sendError(res, passwordError, 400);
  }

  // Find user with valid reset token and verified OTP
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
    'otp.verified': true
  }).select('+password +otp +resetPasswordToken +resetPasswordExpires +invalidatedTokens');

  if (!user) {
    return sendError(res, 'Invalid or expired reset token', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clean up reset fields
  user.password = hashedPassword;
  user.passwordChangedAt = new Date();
  user.otp = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Invalidate all existing tokens for security
  user.activeSessions.forEach(session => {
    user.invalidateToken(session.tokenId, 'password_change');
  });
  user.activeSessions = [];

  await user.save();

  // Send confirmation email
  try {
    await emailService.sendPasswordResetConfirmation(user.email, user.name);
  } catch (error) {
    console.error('Failed to send password reset confirmation:', error);
  }

  sendSuccess(res, 'Password reset successfully. Please login with your new password.');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const token = req.token;
  const user = req.user;

  // Invalidate the current token
  user.invalidateToken(token, 'logout');

  // Remove current session
  user.activeSessions = user.activeSessions.filter(
    session => session.tokenId !== req.tokenId
  );

  await user.save();

  sendSuccess(res, 'Logged out successfully');
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
  const user = req.user;

  // Invalidate all active sessions
  user.activeSessions.forEach(session => {
    user.invalidateToken(session.tokenId, 'logout');
  });

  // Clear all sessions
  user.activeSessions = [];
  await user.save();

  sendSuccess(res, 'Logged out from all devices successfully');
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    profilePicture: user.profilePicture,
    address: user.address,
    preferences: user.preferences,
    accountStatus: user.accountStatus,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };

  sendSuccess(res, 'User profile retrieved successfully', userData);
});

// @desc    Change password for authenticated user
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +invalidatedTokens +activeSessions');

  if (!currentPassword || !newPassword) {
    return sendError(res, 'Current password and new password are required', 400);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return sendError(res, 'Current password is incorrect', 400);
  }

  // Validate new password strength
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return sendError(res, passwordError, 400);
  }

  // Check if new password is different from current
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return sendError(res, 'New password must be different from current password', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  user.password = hashedPassword;
  user.passwordChangedAt = new Date();

  // Invalidate all other sessions for security (keep current session)
  user.activeSessions.forEach(session => {
    if (session.tokenId !== req.tokenId) {
      user.invalidateToken(session.tokenId, 'password_change');
    }
  });
  user.activeSessions = user.activeSessions.filter(
    session => session.tokenId === req.tokenId
  );

  await user.save();

  sendSuccess(res, 'Password changed successfully. Other sessions have been logged out.');
});

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  logout,
  logoutAll,
  getMe,
  changePassword
};
