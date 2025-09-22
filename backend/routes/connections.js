const express = require('express');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Send connection request
router.post('/request', auth, requireRole(['student']), async (req, res) => {
  try {
    const { mentorId, message } = req.body;

    // Check if mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Check if mentor is available
    if (!mentor.isAvailable) {
      return res.status(400).json({ message: 'Mentor is not available for new connections' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      student: req.user._id,
      mentor: mentor.user,
      isActive: true
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection request already exists' });
    }

    // Create connection request
    const connection = new Connection({
      student: req.user._id,
      mentor: mentor.user,
      message: message || '',
      status: 'pending'
    });

    await connection.save();

    // Populate the connection with user details
    const populatedConnection = await Connection.findById(connection._id)
      .populate('student', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email');

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection: populatedConnection
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mentor's connection requests
router.get('/mentor/requests', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ user: req.user._id });
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    const connections = await Connection.find({
      mentor: req.user._id,
      isActive: true
    })
    .populate('student', 'firstName lastName email profilePicture')
    .sort({ requestedAt: -1 });

    res.json(connections);
  } catch (error) {
    console.error('Get mentor requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to connection request
router.put('/:id/respond', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Check if the mentor owns this connection
    if (connection.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already responded
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request already responded to' });
    }

    connection.status = status;
    connection.respondedAt = new Date();
    if (notes) connection.notes = notes;

    await connection.save();

    const populatedConnection = await Connection.findById(connection._id)
      .populate('student', 'firstName lastName email')
      .populate('mentor', 'firstName lastName email');

    res.json({
      message: `Connection request ${status} successfully`,
      connection: populatedConnection
    });
  } catch (error) {
    console.error('Respond to connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's connections
router.get('/student/connections', auth, requireRole(['student']), async (req, res) => {
  try {
    const connections = await Connection.find({
      student: req.user._id,
      isActive: true
    })
    .populate('mentor', 'firstName lastName email profilePicture')
    .sort({ createdAt: -1 });

    res.json(connections);
  } catch (error) {
    console.error('Get student connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel connection request
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    // Check if user owns this connection
    if (connection.student.toString() !== req.user._id.toString() && 
        connection.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already responded
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel responded connection request' });
    }

    connection.status = 'cancelled';
    connection.isActive = false;
    await connection.save();

    res.json({ message: 'Connection request cancelled successfully' });
  } catch (error) {
    console.error('Cancel connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



