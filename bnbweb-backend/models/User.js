const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
    unique: true,
    match: [/^[+]?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true;
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 13 && age <= 120;
      },
      message: 'Age must be between 13 and 120 years'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'moderator'],
    default: 'customer'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  phoneVerificationToken: String,
  phoneVerificationExpires: Date,
  otp: {
    code: {
      type: String,
      select: false
    },
    expires: {
      type: Date,
      select: false
    },
    verified: {
      type: Boolean,
      default: false,
      select: false
    },
    attempts: {
      type: Number,
      default: 0,
      select: false
    }
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  passwordChangedAt: {
    type: Date,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date,
    select: false
  },
  loginIP: {
    type: String,
    select: false
  },
  registrationIP: {
    type: String,
    select: false
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit postal code']
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
      maxlength: [50, 'Country name cannot exceed 50 characters']
    }
  },
  preferences: {
    newsletter: {
      type: Boolean,
      default: false
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  reviewsCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: Date,
  deactivationReason: String
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'address.postalCode': 1 });

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for user's age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for account status
userSchema.virtual('accountStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.lockUntil && this.lockUntil > Date.now()) return 'locked';
  if (!this.isEmailVerified) return 'pending_verification';
  return 'active';
});

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Clean up expired tokens before saving
userSchema.pre('save', function(next) {
  const now = new Date();
  
  // Clean up expired OTP
  if (this.otp && this.otp.expires && this.otp.expires < now) {
    this.otp = undefined;
  }
  
  // Clean up expired reset token
  if (this.resetPasswordExpires && this.resetPasswordExpires < now) {
    this.resetPasswordToken = undefined;
    this.resetPasswordExpires = undefined;
  }
  
  // Clean up expired verification tokens
  if (this.emailVerificationExpires && this.emailVerificationExpires < now) {
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
  }
  
  if (this.phoneVerificationExpires && this.phoneVerificationExpires < now) {
    this.phoneVerificationToken = undefined;
    this.phoneVerificationExpires = undefined;
  }
  
  next();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.otp;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.emailVerificationToken;
    delete ret.phoneVerificationToken;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
