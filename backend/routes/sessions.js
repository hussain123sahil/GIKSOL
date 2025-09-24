const express = require('express');
const Session = require('../models/Session');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');

const router = express.Router();

// Get student dashboard data
router.get('/dashboard/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student info
    const student = await Student.findOne({ user: studentId })
      .populate('user', 'firstName lastName email profilePicture');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get upcoming sessions
    const upcomingSessions = await Session.find({
      student: studentId,
      status: { $in: ['scheduled', 'upcoming'] },
      scheduledDate: { $gte: new Date() },
      isActive: true
    })
    .populate('mentor', 'firstName lastName email profilePicture')
    .sort({ scheduledDate: 1 });

    // Get completed sessions
    const completedSessions = await Session.find({
      student: studentId,
      status: 'completed',
      isActive: true
    })
    .populate('mentor', 'firstName lastName email profilePicture')
    .sort({ scheduledDate: -1 })
    .limit(10);

    // Get connections (mentors from sessions)
    const mentorIds = [...new Set([
      ...upcomingSessions.map(s => s.mentor._id),
      ...completedSessions.map(s => s.mentor._id)
    ])];
    
    const connections = await User.find({
      _id: { $in: mentorIds }
    }).select('firstName lastName email profilePicture');

    // Calculate quick stats
    const quickStats = {
      upcomingSessions: upcomingSessions.length,
      completedSessions: completedSessions.length,
      totalConnections: connections.length,
      totalSessions: await Session.countDocuments({ student: studentId, isActive: true }),
      averageRating: await Session.aggregate([
        { $match: { student: studentId, status: 'completed', rating: { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).then(result => result[0]?.avgRating || 0)
    };

    // Format sessions for frontend
    const formatSessions = (sessions) => {
      return sessions.map(session => ({
        id: session._id,
        mentorId: session.mentor._id,
        mentorName: `${session.mentor.firstName} ${session.mentor.lastName}`,
        mentorCompany: 'Tech Company', // We'll get this from Mentor model later
        title: session.title,
        date: session.formattedDate,
        time: session.formattedTime,
        duration: session.duration,
        status: session.status,
        sessionType: session.sessionType,
        notes: session.notes,
        rating: session.rating,
        meetingLink: session.meetingLink
      }));
    };

    res.json({
      student: {
        id: student.user._id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        profilePicture: student.user.profilePicture
      },
      quickStats,
      upcomingSessions: formatSessions(upcomingSessions),
      completedSessions: formatSessions(completedSessions),
      connections: connections.map(conn => ({
        id: conn._id,
        mentorId: conn._id,
        mentorName: `${conn.firstName} ${conn.lastName}`,
        mentorCompany: 'Tech Company', // We'll get this from Mentor model later
        status: 'accepted',
        requestedAt: new Date().toISOString(),
        respondedAt: new Date().toISOString()
      }))
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new session
router.post('/', async (req, res) => {
  try {
    const { studentId, mentorId, title, description, sessionType, scheduledDate, duration, notes } = req.body;

    // Validate required fields
    if (!studentId || !mentorId || !title || !scheduledDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if student and mentor exist
    const student = await Student.findOne({ user: studentId });
    const mentor = await Mentor.findOne({ user: mentorId });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Create session
    const session = new Session({
      student: studentId,
      mentor: mentorId,
      title,
      description,
      sessionType: sessionType || 'Video Call',
      scheduledDate: new Date(scheduledDate),
      duration: duration || 60,
      notes,
      status: 'scheduled'
    });

    await session.save();

    // Populate the session
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

// Update session status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, rating, feedback } = req.body;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update status
    session.status = status;
    
    if (notes) session.notes = notes;
    if (rating) session.rating = rating;
    if (feedback) session.studentFeedback = feedback;

    // Set completion date if status is completed
    if (status === 'completed') {
      session.completedAt = new Date();
    }

    // Set cancellation date if status is cancelled
    if (status === 'cancelled') {
      session.cancelledAt = new Date();
      session.cancelledBy = req.body.cancelledBy || 'student';
      session.cancellationReason = req.body.cancellationReason;
    }

    await session.save();

    res.json({
      message: 'Session status updated successfully',
      session
    });

  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('student', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sessions for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query = { student: req.params.studentId, isActive: true };
    
    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate('mentor', 'firstName lastName email')
      .sort({ scheduledDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get student sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sessions for a mentor
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query = { mentor: req.params.mentorId, isActive: true };
    
    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .populate('student', 'firstName lastName email')
      .sort({ scheduledDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get mentor sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
