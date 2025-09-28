const mongoose = require('mongoose');

const passwordResetOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  otp: {
    code: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate OTP
passwordResetOTPSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp.code = otp;
  this.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  this.otp.attempts = 0;
  this.isUsed = false;
  return otp;
};

// Verify OTP
passwordResetOTPSchema.methods.verifyOTP = function(enteredOTP) {
  if (this.isUsed) {
    return { valid: false, message: 'OTP has already been used' };
  }

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

  // OTP is valid, mark as used
  this.isUsed = true;
  this.otp.code = null;
  this.otp.expiresAt = null;
  this.otp.attempts = 0;
  
  return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP
passwordResetOTPSchema.methods.clearOTP = function() {
  this.otp.code = null;
  this.otp.expiresAt = null;
  this.otp.attempts = 0;
  this.isUsed = false;
};

// Remove OTP from JSON output
passwordResetOTPSchema.methods.toJSON = function() {
  const otpObject = this.toObject();
  delete otpObject.otp;
  return otpObject;
};

module.exports = mongoose.model('PasswordResetOTP', passwordResetOTPSchema);
