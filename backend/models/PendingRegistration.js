const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
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
    enum: ['student', 'mentor'],
    required: true
  },
  registrationData: {
    type: Object,
    required: true
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
  }
}, {
  timestamps: true
});

// Generate OTP
pendingRegistrationSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp.code = otp;
  this.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  this.otp.attempts = 0;
  return otp;
};

// Verify OTP
pendingRegistrationSchema.methods.verifyOTP = function(enteredOTP) {
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

  // OTP is valid
  return { valid: true, message: 'OTP verified successfully' };
};

// Remove password from JSON output
pendingRegistrationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  return obj;
};

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
