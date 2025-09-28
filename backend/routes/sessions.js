const express = require('express');
const Session = require('../models/Session');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const Connection = require('../models/Connection');
const emailService = require('../services/emailService');

const { auth } = require('../middleware/auth');

const router = express.Router();

// Dashboard route (no auth required - just reading data)
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
    .sort({ scheduledDate: 1 })
    .lean(); // Use lean() to get plain objects

    // Get completed sessions
    const completedSessions = await Session.find({
      student: studentId,
      status: 'completed',
      isActive: true
    })
    .populate('mentor', 'firstName lastName email profilePicture')
    .sort({ scheduledDate: -1 })
    .limit(10)
    .lean(); // Use lean() to get plain objects

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
      return sessions.map(session => {
        const scheduledDate = new Date(session.scheduledDate);
        const formattedDate = scheduledDate.toISOString().split('T')[0];
        const formattedTime = scheduledDate.toTimeString().split(' ')[0].substring(0, 5);
        
        return {
          id: session._id,
          mentorId: session.mentor._id,
          mentorName: `${session.mentor.firstName} ${session.mentor.lastName}`,
          mentorCompany: 'Tech Company', // We'll get this from Mentor model later
          title: session.title,
          date: formattedDate,
          time: formattedTime,
          duration: session.duration,
          status: session.status,
          sessionType: session.sessionType,
          notes: session.notes,
          rating: session.rating,
          meetingLink: session.meetingLink
        };
      });
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

// Apply authentication to all other routes
router.use(auth);

// Create a new session
router.post('/', async (req, res) => {
  try {
    const { studentId, mentorId, title, description, sessionType, scheduledDate, duration, notes } = req.body;

    // Validate required fields
    if (!studentId || !mentorId || !title || !scheduledDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if student and mentor users exist
    const studentUser = await User.findById(studentId);
    const mentorUser = await User.findById(mentorId);

    if (!studentUser) {
      return res.status(404).json({ message: 'Student user not found' });
    }

    if (!mentorUser) {
      return res.status(404).json({ message: 'Mentor user not found' });
    }

    // Create new session
    const session = new Session({
      student: studentId,
      mentor: mentorId,
      title,
      description,
      sessionType,
      scheduledDate: new Date(scheduledDate),
      duration: duration || 60,
      notes,
      status: 'scheduled',
      isActive: true
    });

    await session.save();

    // Populate the session with user details
    const populatedSession = await Session.findById(session._id)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('mentor', 'firstName lastName email profilePicture');

    // Send email notifications
    try {
      // Generate a single Google Meet link for this session
      const meetLink = emailService.generateGoogleMeetLink();
      
      // Send email to student
      await emailService.sendStudentConfirmation(
        {
          title: title,
          scheduledDate: scheduledDate,
          duration: duration || 60,
          sessionType: sessionType,
          description: description
        },
        studentUser.email,
        studentUser.firstName,
        meetLink
      );

      // Send email to mentor with the same meeting link
      await emailService.sendMentorNotification(
        {
          title: title,
          scheduledDate: scheduledDate,
          duration: duration || 60,
          sessionType: sessionType,
          description: description
        },
        mentorUser.email,
        mentorUser.firstName,
        meetLink
      );

      // Update session with meet link
      session.meetingLink = meetLink;
      await session.save();

    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the session creation if email fails
    }

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

// Get mentor dashboard data
router.get('/mentor-dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get mentor info
    const mentor = await Mentor.findOne({ user: userId })
      .populate('user', 'firstName lastName email profilePicture');
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Get upcoming sessions
    const upcomingSessions = await Session.find({
      mentor: userId,
      status: { $in: ['scheduled', 'upcoming'] },
      scheduledDate: { $gte: new Date() },
      isActive: true
    })
    .populate('student', 'firstName lastName email profilePicture')
    .sort({ scheduledDate: 1 });

    // Get completed sessions
    const completedSessions = await Session.find({
      mentor: userId,
      status: 'completed',
      isActive: true
    })
    .populate('student', 'firstName lastName email profilePicture')
    .sort({ scheduledDate: -1 })
    .limit(10);

    // Get connection requests
    const connectionRequests = await Connection.find({
      mentor: userId,
      status: 'pending',
      isActive: true
    })
    .populate('student', 'firstName lastName email profilePicture')
    .sort({ requestedAt: -1 });

    // Get active mentees (students with accepted connections)
    const activeConnections = await Connection.find({
      mentor: userId,
      status: 'accepted',
      isActive: true
    })
    .populate('student', 'firstName lastName email profilePicture');

    // Calculate quick stats
    const totalSessions = await Session.countDocuments({ mentor: userId, isActive: true });
    const avgRatingResult = await Session.aggregate([
      { $match: { mentor: userId, status: 'completed', rating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const quickStats = {
      activeMentees: activeConnections.length,
      upcomingSessions: upcomingSessions.length,
      completedSessions: completedSessions.length,
      pendingRequests: connectionRequests.length,
      totalSessions: totalSessions,
      averageRating: avgRatingResult[0]?.avgRating || 0
    };

    // Format sessions for frontend
    const formatSessions = (sessions) => {
      return sessions.map(session => ({
        id: session._id,
        studentId: session.student._id,
        studentName: `${session.student.firstName} ${session.student.lastName}`,
        studentEmail: session.student.email,
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

    // Format mentees for frontend
    const formatMentees = (connections) => {
      return connections.map(connection => ({
        id: connection._id,
        studentId: connection.student._id,
        studentName: `${connection.student.firstName} ${connection.student.lastName}`,
        studentEmail: connection.student.email,
        school: 'University', // We'll get this from Student model later
        grade: 'Undergraduate', // We'll get this from Student model later
        learningGoals: ['Programming', 'Career Guidance'], // We'll get this from Student model later
        joinedDate: connection.createdAt,
        totalSessions: 0, // We'll calculate this
        lastSessionDate: null
      }));
    };

    // Format connection requests for frontend
    const formatConnectionRequests = (requests) => {
      return requests.map(request => ({
        id: request._id,
        studentId: request.student._id,
        studentName: `${request.student.firstName} ${request.student.lastName}`,
        studentEmail: request.student.email,
        school: 'University', // We'll get this from Student model later
        requestMessage: request.message,
        requestedAt: request.requestedAt,
        status: request.status
      }));
    };

    const response = {
      mentor: {
        id: mentor.user._id,
        firstName: mentor.user.firstName,
        lastName: mentor.user.lastName,
        email: mentor.user.email,
        profilePicture: mentor.user.profilePicture,
        company: mentor.company,
        position: mentor.position,
        expertise: mentor.expertise,
        rating: mentor.rating,
        totalSessions: mentor.totalSessions
      },
      quickStats,
      upcomingSessions: formatSessions(upcomingSessions),
      completedSessions: formatSessions(completedSessions),
      mentees: formatMentees(activeConnections),
      connectionRequests: formatConnectionRequests(connectionRequests)
    };

    res.json(response);

  } catch (error) {
    console.error('Get mentor dashboard data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a session
router.delete('/:id', async (req, res) => {
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

module.exports = router;
