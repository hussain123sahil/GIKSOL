const express = require('express');
const Query = require('../models/Query');
const { auth, requireRole } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Submit a new query (contact form submission)
router.post('/submit', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      newsletter
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create new query
    const query = new Query({
      firstName,
      lastName,
      email,
      phone: phone || '',
      subject,
      message,
      newsletter: newsletter || false,
      source: 'student-help',
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress || ''
    });

    await query.save();

    console.log('✅ New query submitted:', {
      id: query._id,
      name: query.fullName,
      email: query.email,
      subject: query.formattedSubject,
      priority: query.priority
    });

    // Send confirmation email to user
    try {
      await emailService.sendQueryConfirmationEmail(
        query.email,
        query.fullName,
        query
      );
      console.log('✅ Query confirmation email sent to:', query.email);
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError);
      // Don't fail the query submission if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your query has been submitted successfully. We\'ll get back to you within 24 hours. A confirmation email has been sent to your email address.',
      queryId: query._id
    });

  } catch (error) {
    console.error('Error submitting query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit query. Please try again later.'
    });
  }
});

// Get all queries (admin only)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      subject,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (subject) filter.subject = subject;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const queries = await Query.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('respondedBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Query.countDocuments(filter);

    res.json({
      success: true,
      queries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching queries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queries'
    });
  }
});

// Get query by ID (admin only)
router.get('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('respondedBy', 'firstName lastName email');

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    res.json({
      success: true,
      query
    });

  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch query'
    });
  }
});

// Update query status (admin only)
router.patch('/:id/status', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    await query.save();

    res.json({
      success: true,
      message: 'Query status updated successfully',
      query
    });

  } catch (error) {
    console.error('Error updating query status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update query status'
    });
  }
});

// Respond to query (admin only)
router.post('/:id/respond', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { response } = req.body;
    const respondedBy = req.user.id;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    await query.markAsResolved(respondedBy, response);

    res.json({
      success: true,
      message: 'Response added successfully',
      query
    });

  } catch (error) {
    console.error('Error responding to query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to query'
    });
  }
});

// Get query statistics (admin only)
router.get('/stats/overview', auth, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await Query.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
        }
      }
    ]);

    const subjectStats = await Query.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        high: 0,
        urgent: 0
      },
      subjectStats
    });

  } catch (error) {
    console.error('Error fetching query stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch query statistics'
    });
  }
});

module.exports = router;
