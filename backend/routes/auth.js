const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const PendingRegistration = require('../models/PendingRegistration');
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

// Forgot Password
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

    // Generate reset token (simple implementation)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real application, you would send an email here
    // For now, we'll just return the token (for development purposes)
    res.json({
      message: 'Password reset instructions sent to your email',
      resetToken: resetToken, // Remove this in production
      note: 'In production, this token would be sent via email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth Login
router.post('/google-login', async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, profilePicture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Google ID and email are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user for Google login
      user = new User({
        firstName: firstName || 'Google',
        lastName: lastName || 'User',
        email: email,
        password: 'google-oauth-user', // Dummy password for Google users
        role: 'student', // Default role
        isActive: true,
        profilePicture: profilePicture || '',
        googleId: googleId
      });
      await user.save();

      // Create role-specific record
      const Student = require('../models/Student');
      const roleRecord = new Student({
        user: user._id,
        learningGoals: ['Learn new skills', 'Career development'],
        currentLevel: 'beginner',
        interests: ['Technology', 'Programming'],
        preferredLearningStyle: 'visual',
        timeCommitment: '1-2 hours/week',
        budget: { min: 0, max: 100 },
        bio: `Hi, I'm ${user.firstName} ${user.lastName}. I'm excited to start my learning journey!`
      });
      await roleRecord.save();
    } else {
      // Update existing user with Google ID if not present
      if (!user.googleId) {
        user.googleId = googleId;
        if (profilePicture) {
          user.profilePicture = profilePicture;
        }
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Google login successful',
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
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google login' });
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
