const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const PendingRegistration = require('../models/PendingRegistration');
const PasswordResetOTP = require('../models/PasswordResetOTP');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Register - Send OTP for verification
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role,
      // Mentor fields
      company,
      position,
      experience,
      hourlyRate,
      expertise,
      bio,
      linkedinUrl,
      // Student fields
      grade,
      school,
      learningGoals
    } = req.body;

    // Validate role
    if (role && !['student', 'mentor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be student or mentor.' });
    }

    // Check if user already exists in User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if there's a pending registration
    let pendingRegistration = await PendingRegistration.findOne({ email });
    
    if (pendingRegistration) {
      // Update existing pending registration
      pendingRegistration.firstName = firstName;
      pendingRegistration.lastName = lastName;
      pendingRegistration.password = password;
      pendingRegistration.role = role || 'student';
      pendingRegistration.registrationData = {
        company,
        position,
        experience,
        hourlyRate,
        expertise,
        bio,
        linkedinUrl,
        grade,
        school,
        learningGoals
      };
    } else {
      // Create new pending registration
      pendingRegistration = new PendingRegistration({
        firstName,
        lastName,
        email,
        password,
        role: role || 'student',
        registrationData: {
          company,
          position,
          experience,
          hourlyRate,
          expertise,
          bio,
          linkedinUrl,
          grade,
          school,
          learningGoals
        }
      });
    }

    // Generate and send OTP
    const otp = pendingRegistration.generateOTP();
    await pendingRegistration.save();
    
    // Send OTP email
    try {
      await emailService.sendOTPVerification(email, firstName, otp, role || 'student');
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Continue with OTP verification flow even if email fails
    }

    res.status(201).json({
      message: 'OTP sent to your email for verification',
      email: email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find pending registration by email
    const pendingRegistration = await PendingRegistration.findOne({ email });
    if (!pendingRegistration) {
      return res.status(404).json({ message: 'No pending registration found for this email' });
    }

    // Verify OTP
    const verificationResult = pendingRegistration.verifyOTP(otp);
    
    if (!verificationResult.valid) {
      await pendingRegistration.save(); // Save the updated attempts count
      return res.status(400).json({ message: verificationResult.message });
    }

    // OTP is valid, create the actual user record
    const user = new User({
      firstName: pendingRegistration.firstName,
      lastName: pendingRegistration.lastName,
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      role: pendingRegistration.role,
      isEmailVerified: true
    });

    await user.save();

    // Create role-specific record
    let roleRecord = null;
    if (user.role === 'student') {
      const { grade, school, learningGoals } = pendingRegistration.registrationData || {};
      roleRecord = new Student({
        user: user._id,
        grade: grade || 'Not specified',
        school: school || 'Not specified',
        learningGoals: learningGoals || ['Learn new skills', 'Career development'],
        currentLevel: 'beginner',
        interests: ['Technology', 'Programming'],
        preferredLearningStyle: 'visual',
        timeCommitment: '1-2 hours/week',
        budget: { min: 0, max: 100 },
        bio: `Hi, I'm ${user.firstName} ${user.lastName}. I'm excited to start my learning journey!`
      });
      await roleRecord.save();
    } else if (user.role === 'mentor') {
      const { company, position, experience, hourlyRate, expertise, bio, linkedinUrl } = pendingRegistration.registrationData || {};
      roleRecord = new Mentor({
        user: user._id,
        company: company || 'Not specified',
        position: position || 'Not specified',
        expertise: expertise || ['General Mentoring', 'Career Guidance'],
        hourlyRate: hourlyRate || 50,
        experience: experience || 'Experienced professional',
        bio: bio || `Hi, I'm ${user.firstName} ${user.lastName}. I'm passionate about helping others grow and succeed!`,
        linkedinUrl: linkedinUrl || '',
        education: [{
          degree: 'Bachelor\'s Degree',
          institution: 'University',
          year: 2020
        }],
        certifications: []
      });
      await roleRecord.save();
    }

    // Delete the pending registration
    await PendingRegistration.findByIdAndDelete(pendingRegistration._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully. Registration completed!',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      roleRecord: roleRecord ? {
        id: roleRecord._id,
        type: user.role
      } : null
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find pending registration by email
    const pendingRegistration = await PendingRegistration.findOne({ email });
    if (!pendingRegistration) {
      return res.status(404).json({ message: 'No pending registration found for this email' });
    }

    // Generate new OTP
    const otp = pendingRegistration.generateOTP();
    await pendingRegistration.save();
    
    // Send OTP email
    await emailService.sendOTPVerification(email, pendingRegistration.firstName, otp, pendingRegistration.role);

    res.status(200).json({
      message: 'OTP resent to your email',
      email: email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
        isEmailVerified: req.user.isEmailVerified,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if there's an existing unused OTP
    let passwordResetOTP = await PasswordResetOTP.findOne({ 
      email, 
      isUsed: false,
      'otp.expiresAt': { $gt: new Date() }
    });

    if (passwordResetOTP) {
      // Update existing OTP
      const otp = passwordResetOTP.generateOTP();
      await passwordResetOTP.save();
    } else {
      // Create new OTP
      passwordResetOTP = new PasswordResetOTP({ email });
      const otp = passwordResetOTP.generateOTP();
      await passwordResetOTP.save();
    }

    // Send OTP email
    try {
      await emailService.sendPasswordResetOTP(email, user.firstName, passwordResetOTP.otp.code);
    } catch (error) {
      console.error('Failed to send password reset OTP email:', error);
      // Continue with OTP verification flow even if email fails
    }

    res.json({
      message: 'Password reset OTP sent to your email',
      email: email,
      requiresOTP: true
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Password Reset OTP
router.post('/verify-password-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find password reset OTP by email
    const passwordResetOTP = await PasswordResetOTP.findOne({ 
      email, 
      isUsed: false,
      'otp.expiresAt': { $gt: new Date() }
    });
    
    if (!passwordResetOTP) {
      return res.status(404).json({ message: 'No valid OTP found for this email' });
    }

    // Verify OTP
    const verificationResult = passwordResetOTP.verifyOTP(otp);
    
    if (!verificationResult.valid) {
      await passwordResetOTP.save(); // Save the updated attempts count
      return res.status(400).json({ message: verificationResult.message });
    }

    // OTP is valid, mark as used and save
    await passwordResetOTP.save();

    res.status(200).json({
      message: 'OTP verified successfully. You can now reset your password.',
      email: email,
      verified: true
    });
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Email, OTP, new password, and confirm password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find password reset OTP by email (allow recently used OTPs within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const passwordResetOTP = await PasswordResetOTP.findOne({ 
      email, 
      $or: [
        { isUsed: false },
        { isUsed: true, updatedAt: { $gt: fiveMinutesAgo } }
      ],
      'otp.expiresAt': { $gt: new Date() }
    });
    
    if (!passwordResetOTP) {
      return res.status(404).json({ message: 'No valid OTP found for this email' });
    }

    // For already verified OTPs, just check if the OTP code matches
    let verificationResult;
    if (passwordResetOTP.isUsed) {
      // OTP was already verified, just check if it matches
      if (passwordResetOTP.otp.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      verificationResult = { valid: true, message: 'OTP already verified' };
    } else {
      // OTP not yet verified, verify it now
      verificationResult = passwordResetOTP.verifyOTP(otp);
    }
    
    if (!verificationResult.valid) {
      await passwordResetOTP.save(); // Save the updated attempts count
      return res.status(400).json({ message: verificationResult.message });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete the used OTP and clean up any other unused OTPs for this email
    await PasswordResetOTP.deleteMany({ 
      email: email
    });

    res.json({ 
      message: 'Password reset successfully',
      email: email
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Check if user exists (for testing)
router.get('/check-user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (user) {
      res.json({ exists: true, user: { id: user._id, email: user.email, isEmailVerified: user.isEmailVerified } });
    } else {
      res.status(404).json({ exists: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
