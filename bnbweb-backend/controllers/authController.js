const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken, sendSuccess, sendError } = require('../utils/helpers');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dateOfBirth, gender } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'User already exists with this email', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender
  });

  // Generate token
  const token = generateToken(user._id);

  sendSuccess(res, 'User registered successfully', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      role: user.role
    }
  }, 201);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is inactive. Please contact support.', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user._id);

  sendSuccess(res, 'Login successful', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  sendSuccess(res, 'Profile retrieved successfully', { user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  
  await user.save();
  
  sendSuccess(res, 'Profile updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return sendError(res, 'Current password is incorrect', 400);
  }
  
  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);
  
  user.password = hashedNewPassword;
  await user.save();
  
  sendSuccess(res, 'Password changed successfully');
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
  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is inactive. Please contact support.', 401);
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Update user with OTP
  user.otp = {
    code: otp,
    expires: otpExpires,
    verified: false
  };
  await user.save();

  // In production, send OTP via SMS/Email
  // For demo, we'll just return the OTP
  console.log(`OTP for ${email}: ${otp}`);
  
  sendSuccess(res, 'OTP sent successfully', { 
    message: 'OTP sent to your registered email/phone',
    // Remove in production - only for demo
    otp: otp 
  });
});

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Check if OTP exists and is not expired
  if (!user.otp || !user.otp.code || user.otp.expires < new Date()) {
    return sendError(res, 'OTP expired or invalid', 400);
  }

  // Check if OTP matches
  if (user.otp.code !== otp) {
    return sendError(res, 'Invalid OTP', 400);
  }

  // Mark OTP as verified and clear it
  user.otp.verified = true;
  user.otp.code = undefined;
  user.otp.expires = undefined;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  sendSuccess(res, 'OTP verified and login successful', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Update user with new OTP
  user.otp = {
    code: otp,
    expires: otpExpires,
    verified: false
  };
  await user.save();

  // In production, send OTP via SMS/Email
  console.log(`New OTP for ${email}: ${otp}`);
  
  sendSuccess(res, 'OTP resent successfully', { 
    message: 'New OTP sent to your registered email/phone',
    // Remove in production - only for demo
    otp: otp 
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  sendOTP,
  verifyOTP,
  resendOTP
};
