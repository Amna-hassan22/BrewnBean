const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken, sendSuccess, sendError } = require('../utils/helpers');
const axios = require('axios');

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour
const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

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
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);
  
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
  if (!hasNonalphas) {
    return 'Password must contain at least one special character';
  }
  return null;
};

// Check account lockout
const checkAccountLockout = (user) => {
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return true;
  }
  return false;
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
};

// Handle successful login
const handleSuccessfulLogin = async (user) => {
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dateOfBirth, gender } = req.body;

  // Validate password strength
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return sendError(res, passwordError, 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [
      { email },
      { phone: phone || null }
    ]
  });
  
  if (existingUser) {
    if (existingUser.email === email) {
      return sendError(res, 'User already exists with this email', 400);
    }
    if (existingUser.phone === phone) {
      return sendError(res, 'User already exists with this phone number', 400);
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password: hashedPassword,
    phone: phone || undefined,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender: gender || undefined,
    registrationIP: req.ip,
    lastLogin: new Date()
  });

  // Generate token
  const token = generateToken(user._id);

  // Remove sensitive data from response
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt
  };

  sendSuccess(res, 'User registered successfully', {
    token,
    user: userResponse
  }, 201);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Check if account is locked
  if (checkAccountLockout(user)) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return sendError(res, `Account locked. Try again in ${lockTimeRemaining} minutes.`, 423);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is inactive. Please contact support.', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await handleFailedLogin(user);
    return sendError(res, 'Invalid email or password', 401);
  }

  // Handle successful login
  await handleSuccessfulLogin(user);

  // Generate token
  const token = generateToken(user._id);

  // Update last login
  user.lastLogin = new Date();
  user.loginIP = req.ip;
  await user.save();

  // Remove sensitive data from response
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    lastLogin: user.lastLogin
  };

  sendSuccess(res, 'Login successful', {
    token,
    user: userResponse
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -loginAttempts -lockUntil -otp');
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }
  
  sendSuccess(res, 'Profile retrieved successfully', { user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }
  
  // Check if phone number is already used by another user
  if (phone && phone !== user.phone) {
    const existingUser = await User.findOne({ phone, _id: { $ne: req.user.id } });
    if (existingUser) {
      return sendError(res, 'Phone number already in use', 400);
    }
  }
  
  // Update fields
  if (name) user.name = name.trim();
  if (phone) user.phone = phone;
  if (address) {
    user.address = {
      ...user.address,
      ...address
    };
  }
  
  await user.save();
  
  // Remove sensitive data from response
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified
  };
  
  sendSuccess(res, 'Profile updated successfully', { user: userResponse });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Validate new password strength
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return sendError(res, passwordError, 400);
  }
  
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }
  
  // Check current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return sendError(res, 'Current password is incorrect', 400);
  }
  
  // Check if new password is different from current
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return sendError(res, 'New password must be different from current password', 400);
  }
  
  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);
  
  user.password = hashedNewPassword;
  user.passwordChangedAt = new Date();
  await user.save();
  
  sendSuccess(res, 'Password changed successfully');
});

// @desc    Refresh JWT token
// @route   POST /api/auth/refresh-token
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user || !user.isActive) {
    return sendError(res, 'User not found or inactive', 404);
  }
  
  // Generate new token
  const token = generateToken(user._id);
  
  sendSuccess(res, 'Token refreshed successfully', { token });
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Logout successful');
});

// @desc    Send OTP for login
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is inactive. Please contact support.', 401);
  }

  // Check if account is locked
  if (checkAccountLockout(user)) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return sendError(res, `Account locked. Try again in ${lockTimeRemaining} minutes.`, 423);
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY);

  // Update user with OTP
  user.otp = {
    code: otp,
    expires: otpExpires,
    verified: false,
    attempts: 0
  };
  await user.save();

  // TODO: In production, send OTP via SMS/Email service (Twilio, SendGrid, etc.)
  // For demo purposes, we'll log it and return it
  console.log(`OTP for ${email}: ${otp}`);
  
  sendSuccess(res, 'OTP sent successfully', { 
    message: 'OTP sent to your registered email/phone',
    expiresIn: '10 minutes',
    // Remove in production - only for demo
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  });
});

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if OTP exists and is not expired
  if (!user.otp || !user.otp.code || user.otp.expires < new Date()) {
    return sendError(res, 'OTP expired or invalid', 400);
  }

  // Check OTP attempts
  if (user.otp.attempts >= 3) {
    user.otp = undefined;
    await user.save();
    return sendError(res, 'Too many OTP attempts. Please request a new OTP.', 429);
  }

  // Check if OTP matches
  if (user.otp.code !== otp) {
    user.otp.attempts = (user.otp.attempts || 0) + 1;
    await user.save();
    return sendError(res, 'Invalid OTP', 400);
  }

  // Mark OTP as verified and clear it
  user.otp = undefined;
  user.lastLogin = new Date();
  user.loginIP = req.ip;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Remove sensitive data from response
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    lastLogin: user.lastLogin
  };

  sendSuccess(res, 'OTP verified and login successful', {
    token,
    user: userResponse
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is inactive. Please contact support.', 401);
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY);

  // Update user with new OTP
  user.otp = {
    code: otp,
    expires: otpExpires,
    verified: false,
    attempts: 0
  };
  await user.save();

  // TODO: In production, send OTP via SMS/Email service
  console.log(`New OTP for ${email}: ${otp}`);
  
  sendSuccess(res, 'OTP resent successfully', { 
    message: 'New OTP sent to your registered email/phone',
    expiresIn: '10 minutes',
    // Remove in production - only for demo
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  });
});

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists or not for security
    return sendSuccess(res, 'If the email exists, password reset instructions have been sent');
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const resetTokenExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

  // Save reset token
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpires;
  await user.save();

  // TODO: In production, send password reset email
  console.log(`Password reset token for ${email}: ${resetToken}`);
  
  sendSuccess(res, 'Password reset instructions sent to your email', {
    // Remove in production - only for demo
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Validate password strength
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return sendError(res, passwordError, 400);
  }

  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return sendError(res, 'Invalid or expired reset token', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update user password and clear reset token
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.passwordChangedAt = new Date();
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  sendSuccess(res, 'Password reset successful');
});

// @desc    Authenticate user with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return sendError(res, 'Google ID token is required', 400);
  }

  try {
    // Verify the Google ID token
    const googleResponse = await axios.get(`${GOOGLE_TOKEN_INFO_URL}?id_token=${idToken}`);
    const { 
      email, 
      name, 
      sub: googleId, 
      picture,
      email_verified 
    } = googleResponse.data;

    // Check if token is valid and email is verified
    if (!email_verified) {
      return sendError(res, 'Google email not verified', 400);
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    // If not found by googleId, try to find by email
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      // User exists - update Google info
      user.googleId = googleId;
      user.googleProfile = googleResponse.data;
      user.profilePicture = picture;
      user.lastLogin = new Date();
      user.loginIP = req.ip;
      
      // If user was found by email but didn't have googleId, update name if it's empty
      if (!user.googleId && !user.name && name) {
        user.name = name;
      }

      await user.save();
    } else {
      // Create a new user
      user = await User.create({
        name,
        email,
        googleId,
        googleProfile: googleResponse.data,
        profilePicture: picture,
        isEmailVerified: true, // Google already verified the email
        lastLogin: new Date(),
        loginIP: req.ip,
        registrationIP: req.ip,
        isActive: true,
        role: 'user'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove sensitive data from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin
    };

    sendSuccess(res, 'Google authentication successful', {
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return sendError(res, 'Failed to verify Google token', 401);
  }
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  sendOTP,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  googleAuth
};
