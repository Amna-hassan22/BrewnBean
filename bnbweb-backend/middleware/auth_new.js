const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/helpers');

// Protect routes - Authentication middleware
const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (if using cookie-based auth)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id)
        .select('+passwordChangedAt +invalidatedTokens +activeSessions');
      
      if (!user) {
        return sendError(res, 'Invalid token. User not found.', 401);
      }

      if (!user.isActive) {
        return sendError(res, 'User account is inactive.', 401);
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        return sendError(res, 'Account is temporarily locked. Please try again later.', 423);
      }

      // Check if token is invalidated
      if (user.isTokenInvalidated(token)) {
        return sendError(res, 'Token has been invalidated. Please log in again.', 401);
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return sendError(res, 'User recently changed password. Please log in again.', 401);
      }

      // Validate token ID for session management
      if (decoded.tokenId) {
        const activeSession = user.activeSessions.find(
          session => session.tokenId === decoded.tokenId
        );

        if (!activeSession) {
          return sendError(res, 'Session expired. Please log in again.', 401);
        }

        // Update last activity
        activeSession.lastActivity = new Date();
        await user.save();

        // Store tokenId in request for logout functionality
        req.tokenId = decoded.tokenId;
      }

      // Store token in request for logout functionality
      req.token = token;
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired. Please log in again.', 401);
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token format.', 401);
      }
      return sendError(res, 'Token verification failed.', 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return sendError(res, 'Authentication failed.', 500);
  }
};

// Admin middleware
const adminAuth = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401);
  }

  if (req.user.role !== 'admin') {
    return sendError(res, 'Access denied. Admin privileges required.', 403);
  }

  next();
};

// Moderator or Admin middleware
const moderatorAuth = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Access denied. Authentication required.', 401);
  }

  if (!['admin', 'moderator'].includes(req.user.role)) {
    return sendError(res, 'Access denied. Moderator privileges required.', 403);
  }

  next();
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id)
          .select('+passwordChangedAt +invalidatedTokens +activeSessions');
        
        if (user && user.isActive && !user.isAccountLocked() && 
            !user.changedPasswordAfter(decoded.iat) && 
            !user.isTokenInvalidated(token)) {
          
          // Validate session if tokenId exists
          if (decoded.tokenId) {
            const activeSession = user.activeSessions.find(
              session => session.tokenId === decoded.tokenId
            );
            if (activeSession) {
              req.user = user;
              req.token = token;
              req.tokenId = decoded.tokenId;
            }
          } else {
            req.user = user;
            req.token = token;
          }
        }
      } catch (error) {
        // Token invalid but continue without user
        console.log('Optional auth token invalid:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Check if user owns resource or is admin
const resourceOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (!resourceUserId) {
    return sendError(res, 'Resource user ID is required.', 400);
  }

  if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
    return sendError(res, 'Access denied. You can only access your own resources.', 403);
  }

  next();
};

// Rate limiting middleware based on user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    }

    const userRequests = requests.get(userId) || [];
    
    if (userRequests.length >= maxRequests) {
      return sendError(res, 'Too many requests. Please try again later.', 429);
    }

    userRequests.push(now);
    requests.set(userId, userRequests);
    
    next();
  };
};

// Verify email middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return sendError(res, 'Email verification required. Please verify your email address.', 403);
  }
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

module.exports = {
  auth,
  adminAuth,
  moderatorAuth,
  optionalAuth,
  resourceOwnership,
  userRateLimit,
  requireEmailVerification,
  securityHeaders
};
