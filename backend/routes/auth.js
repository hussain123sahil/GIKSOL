const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || 'student'
    });

    await user.save();

    // Create role-specific record
    let roleRecord = null;
    if (user.role === 'student') {
      roleRecord = new Student({
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
    } else if (user.role === 'mentor') {
      roleRecord = new Mentor({
        user: user._id,
        company: 'Your Company',
        position: 'Your Position',
        expertise: ['General Mentoring', 'Career Guidance'],
        hourlyRate: 50,
        bio: `Hi, I'm ${user.firstName} ${user.lastName}. I'm passionate about helping others grow and succeed!`,
        linkedinUrl: '',
        education: [{
          degree: 'Bachelor\'s Degree',
          institution: 'University',
          year: 2020
        }],
        certifications: []
      });
      await roleRecord.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      roleRecord: roleRecord ? {
        id: roleRecord._id,
        type: user.role
      } : null
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
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

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
