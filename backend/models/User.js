const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    default: 'student'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  registrationData: {
    type: Object,
    default: null
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp.code = otp;
  this.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  this.otp.attempts = 0;
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(enteredOTP) {
  if (!this.otp.code || !this.otp.expiresAt) {
    return { valid: false, message: 'No OTP found' };
  }

  if (new Date() > this.otp.expiresAt) {
    return { valid: false, message: 'OTP has expired' };
  }

  if (this.otp.attempts >= 3) {
    return { valid: false, message: 'Too many OTP attempts. Please request a new OTP.' };
  }

  if (this.otp.code !== enteredOTP) {
    this.otp.attempts += 1;
    return { valid: false, message: 'Invalid OTP' };
  }

  // OTP is valid, clear it
  this.otp.code = null;
  this.otp.expiresAt = null;
  this.otp.attempts = 0;
  this.isEmailVerified = true;
  
  return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP
userSchema.methods.clearOTP = function() {
  this.otp.code = null;
  this.otp.expiresAt = null;
  this.otp.attempts = 0;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.otp;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
