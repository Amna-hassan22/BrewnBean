# Secure Authentication System Documentation

## Overview
This document outlines the secure and production-ready authentication system implemented for the Brew&Bean backend. The system follows industry best practices for security, scalability, and user experience.

## Features Implemented

### 🔐 Core Authentication Features
- **Secure Registration** with password strength validation
- **Login with email/username** and password (bcrypt hashed)
- **JWT-based authentication** with token invalidation support
- **Password reset via email OTP** with expiration and attempt limits
- **Secure logout** with token invalidation
- **Logout from all devices** functionality
- **Change password** with validation and session management

### 🛡️ Security Features
- **Password Security**
  - bcrypt hashing with 12 salt rounds
  - Strong password requirements (uppercase, lowercase, numbers, special chars)
  - Minimum 8 characters length
  
- **Account Protection**
  - Failed login attempt tracking (max 5 attempts)
  - Account lockout for 30 minutes after max attempts
  - IP-based tracking for login attempts
  
- **Token Security**
  - JWT tokens with expiration (7 days default)
  - Token invalidation on logout/password change
  - Session management with device tracking
  - Automatic cleanup of old invalidated tokens
  
- **OTP Security**
  - 6-digit secure OTP generation
  - 10-minute expiration time
  - Maximum 3 OTP attempts per request
  - Email delivery with branded templates
  
- **Rate Limiting**
  - Login: 8 attempts per 15 minutes
  - Auth operations: 5 attempts per 15 minutes
  - OTP requests: 2 per minute
  - Password reset: 3 per hour

### 📧 Email System
- **Professional email templates** for OTP and confirmations
- **Secure email service** integration (Gmail/SMTP)
- **Development mode** with Ethereal Email for testing
- **Branded email design** matching Brew&Bean theme

### 🔒 Middleware Security
- **Enhanced auth middleware** with token validation
- **Session management** with device tracking
- **Security headers** (XSS protection, content type options, etc.)
- **Optional authentication** for public/semi-public routes
- **Resource ownership** validation
- **Email verification** requirements where needed

## API Endpoints

### Public Endpoints

#### POST `/api/auth/register`
Register a new user account.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

#### POST `/api/auth/login`
Login with email/username and password.
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

#### POST `/api/auth/forgot-password`
Request password reset OTP.
```json
{
  "email": "john@example.com"
}
```

#### POST `/api/auth/verify-otp`
Verify OTP for password reset.
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### POST `/api/auth/reset-password`
Reset password using verified OTP token.
```json
{
  "resetToken": "64-character-hex-token",
  "newPassword": "NewSecurePass123!"
}
```

### Protected Endpoints (Require Authentication)

#### GET `/api/auth/me`
Get current user profile.

#### PUT `/api/auth/change-password`
Change password for authenticated user.
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePass123!"
}
```

#### POST `/api/auth/logout`
Logout from current device.

#### POST `/api/auth/logout-all`
Logout from all devices.

## Database Schema Updates

### User Model Enhancements
```javascript
// JWT Token invalidation
invalidatedTokens: [{
  token: String,
  invalidatedAt: Date,
  reason: String // 'logout', 'password_change', 'security_breach'
}]

// Session management
activeSessions: [{
  tokenId: String,
  deviceInfo: String,
  ipAddress: String,
  lastActivity: Date,
  createdAt: Date
}]

// Security fields
loginAttempts: Number,
lockUntil: Date,
lastLogin: Date,
loginIP: String,
passwordChangedAt: Date,

// OTP management
otp: {
  code: String,
  expires: Date,
  verified: Boolean,
  attempts: Number
}
```

## Security Best Practices Implemented

### 1. Password Security
- ✅ bcrypt with 12 salt rounds
- ✅ Strong password validation
- ✅ Password change invalidates other sessions
- ✅ No password in API responses

### 2. Token Security
- ✅ JWT with expiration
- ✅ Token invalidation on logout
- ✅ Session management
- ✅ Token verification on each request

### 3. Rate Limiting
- ✅ IP-based rate limiting
- ✅ Different limits for different operations
- ✅ User-based rate limiting for authenticated routes

### 4. Account Security
- ✅ Account lockout after failed attempts
- ✅ Login attempt tracking
- ✅ Device and IP tracking
- ✅ Secure OTP generation and validation

### 5. Input Validation
- ✅ Express-validator for all inputs
- ✅ Email normalization
- ✅ Data sanitization
- ✅ Strong validation schemas

### 6. Error Handling
- ✅ Consistent error responses
- ✅ No sensitive information in errors
- ✅ Proper HTTP status codes
- ✅ Detailed logging for debugging

## Environment Configuration

### Required Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@brewbean.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@brewbean.com

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=1800000  # 30 minutes
OTP_EXPIRY=600000     # 10 minutes
PASSWORD_RESET_EXPIRY=3600000  # 1 hour
```

## Testing the System

### 1. Registration Flow
1. POST to `/api/auth/register` with valid data
2. Verify user is created and JWT token is returned
3. Test with invalid/weak passwords (should fail)
4. Test with existing email (should fail)

### 2. Login Flow
1. POST to `/api/auth/login` with correct credentials
2. Verify JWT token is returned
3. Test with wrong password (should track attempts)
4. Test account lockout after 5 failed attempts

### 3. Password Reset Flow
1. POST to `/api/auth/forgot-password` with email
2. Check email for OTP (use Ethereal in development)
3. POST to `/api/auth/verify-otp` with OTP
4. POST to `/api/auth/reset-password` with reset token
5. Verify password is changed and old sessions are invalidated

### 4. Security Testing
1. Test rate limiting by making multiple requests
2. Test token invalidation after logout
3. Test session management with multiple devices
4. Test OTP expiration and attempt limits

## Production Deployment Checklist

### Environment Setup
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Configure production email service
- [ ] Set up MongoDB with proper indexes
- [ ] Configure Redis for session management (optional)
- [ ] Set proper CORS origins

### Security Configuration
- [ ] Enable HTTPS in production
- [ ] Configure rate limiting appropriately
- [ ] Set up proper logging and monitoring
- [ ] Configure backup strategies
- [ ] Implement security headers

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure application monitoring
- [ ] Set up alerts for failed login attempts
- [ ] Monitor token invalidation patterns

## Troubleshooting

### Common Issues
1. **Email not sending**: Check SMTP configuration and credentials
2. **Token validation failing**: Verify JWT secret consistency
3. **Rate limiting too aggressive**: Adjust rate limit settings
4. **Session not updating**: Check MongoDB connection and User model

### Debug Steps
1. Check logs for detailed error messages
2. Verify environment variables are set
3. Test email service connectivity
4. Validate JWT token format and expiration

## Future Enhancements

### Potential Additions
- Two-factor authentication (2FA)
- Social login integration (Google, Facebook)
- Advanced session management
- Audit logging for security events
- Biometric authentication support
- Advanced fraud detection

This authentication system provides a solid foundation for secure user management in the Brew&Bean application while maintaining flexibility for future enhancements.
