const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const Connection = require('../models/Connection');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(auth);
router.use(requireRole(['admin']));

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform users to include id field for frontend compatibility
    const usersWithId = users.map(user => {
      const userObj = user.toObject();
      return {
        ...userObj,
        id: userObj._id
      };
    });

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithId,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get role-specific profile
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id });
    } else if (user.role === 'mentor') {
      profile = await Mentor.findOne({ user: user._id });
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
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

    // Create role-specific profile
    let profile = null;
    if (user.role === 'student') {
      profile = new Student({
        user: user._id,
        learningGoals: ['Learn new skills', 'Career development'],
        currentLevel: 'beginner',
        interests: ['Technology', 'Programming'],
        preferredLearningStyle: 'visual',
        timeCommitment: '1-2 hours/week',
        budget: { min: 0, max: 100 },
        bio: `Hi, I'm ${user.firstName} ${user.lastName}. I'm excited to start my learning journey!`
      });
      await profile.save();
    } else if (user.role === 'mentor') {
      profile = new Mentor({
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
        certifications: [],
        isAvailable: true,
        rating: 0,
        totalSessions: 0
      });
      await profile.save();
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      profile: profile ? {
        id: profile._id,
        type: user.role
      } : null
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error during user creation' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during user update' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete role-specific profile first
    if (user.role === 'student') {
      await Student.deleteOne({ user: user._id });
    } else if (user.role === 'mentor') {
      await Mentor.deleteOne({ user: user._id });
    }

    // Delete related sessions and connections
    await Session.deleteMany({ 
      $or: [{ student: user._id }, { mentor: user._id }] 
    });
    await Connection.deleteMany({ 
      $or: [{ student: user._id }, { mentor: user._id }] 
    });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error during user deletion' });
  }
});

// Get all students with their profiles
router.get('/students', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find({ role: 'student', ...query })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const studentsWithProfiles = await Promise.all(
      students.map(async (student) => {
        const profile = await Student.findOne({ user: student._id });
        const studentObj = student.toObject();
        return {
          ...studentObj,
          id: studentObj._id, // Add id field for frontend compatibility
          profile
        };
      })
    );

    const total = await User.countDocuments({ role: 'student', ...query });

    res.json({
      students: studentsWithProfiles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all mentors with their profiles
router.get('/mentors', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const mentors = await User.find({ role: 'mentor', ...query })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const mentorsWithProfiles = await Promise.all(
      mentors.map(async (mentor) => {
        const profile = await Mentor.findOne({ user: mentor._id });
        const mentorObj = mentor.toObject();
        return {
          ...mentorObj,
          id: mentorObj._id, // Add id field for frontend compatibility
          profile
        };
      })
    );

    const total = await User.countDocuments({ role: 'mentor', ...query });

    res.json({
      mentors: mentorsWithProfiles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMentors: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student profile
router.put('/students/:id/profile', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const profile = await Student.findOne({ user: student._id });
    if (!profile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const updatedProfile = await Student.findByIdAndUpdate(
      profile._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Student profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Update mentor profile
router.put('/mentors/:id/profile', async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    const profile = await Mentor.findOne({ user: mentor._id });
    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    const updatedProfile = await Mentor.findByIdAndUpdate(
      profile._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Mentor profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update mentor profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalSessions = await Session.countDocuments();
    const totalConnections = await Connection.countDocuments();
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Sessions by status
    const sessionsByStatus = await Session.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalMentors,
      totalAdmins,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalSessions,
      totalConnections,
      recentRegistrations,
      sessionsByStatus
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sessions
router.get('/sessions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate('student', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSessions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new session
router.post('/sessions', async (req, res) => {
  try {
    const { title, description, scheduledDate, duration, status, mentorId, studentId, meetingLink, notes } = req.body;

    // Validate required fields
    if (!title || !scheduledDate || !mentorId || !studentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if mentor and student exist
    const mentor = await User.findById(mentorId);
    const student = await User.findById(studentId);

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create new session
    const session = new Session({
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      duration: duration || 60,
      status: status || 'scheduled',
      mentor: mentorId,
      student: studentId,
      meetingLink,
      notes,
      isActive: true
    });

    await session.save();

    // Populate the session with user details
    const populatedSession = await Session.findById(session._id)
      .populate('student', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email');

    res.status(201).json({
      message: 'Session created successfully',
      session: populatedSession
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a session
router.put('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const updateData = req.body;

    // Check if session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update the session
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('student', 'firstName lastName email')
     .populate('mentor', 'firstName lastName email');

    res.json({
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Check if session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete the session
    await Session.findByIdAndDelete(sessionId);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all connections
router.get('/connections', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.status = status;
    }

    const connections = await Connection.find(query)
      .populate('student', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Connection.countDocuments(query);

    res.json({
      connections,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalConnections: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
