const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
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
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'general',
      'technical', 
      'billing',
      'mentor',
      'session',
      'profile',
      'feedback',
      'other'
    ],
    default: 'general'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  newsletter: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  response: {
    type: String,
    trim: true,
    maxlength: [2000, 'Response cannot exceed 2000 characters']
  },
  respondedAt: {
    type: Date,
    default: null
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  source: {
    type: String,
    enum: ['student-help', 'mentor-help', 'general-contact', 'api'],
    default: 'student-help'
  },
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
querySchema.index({ email: 1, createdAt: -1 });
querySchema.index({ status: 1, priority: 1 });
querySchema.index({ subject: 1 });
querySchema.index({ assignedTo: 1 });
querySchema.index({ createdAt: -1 });

// Virtual for full name
querySchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted subject
querySchema.virtual('formattedSubject').get(function() {
  const subjectMap = {
    'general': 'General Inquiry',
    'technical': 'Technical Support',
    'billing': 'Billing Question',
    'mentor': 'Mentor Connection',
    'session': 'Session Booking',
    'profile': 'Profile Issues',
    'feedback': 'Feedback',
    'other': 'Other'
  };
  return subjectMap[this.subject] || this.subject;
});

// Method to mark as resolved
querySchema.methods.markAsResolved = function(respondedBy, response) {
  this.status = 'resolved';
  this.respondedAt = new Date();
  this.respondedBy = respondedBy;
  this.response = response;
  return this.save();
};

// Method to assign to user
querySchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.status = 'in-progress';
  return this.save();
};

// Pre-save middleware to set priority based on subject
querySchema.pre('save', function(next) {
  if (this.isNew) {
    // Set priority based on subject
    const priorityMap = {
      'technical': 'high',
      'billing': 'high',
      'session': 'medium',
      'mentor': 'medium',
      'profile': 'medium',
      'general': 'low',
      'feedback': 'low',
      'other': 'low'
    };
    this.priority = priorityMap[this.subject] || 'medium';
  }
  next();
});

// Remove sensitive data from JSON output
querySchema.methods.toJSON = function() {
  const queryObject = this.toObject();
  delete queryObject.ipAddress;
  return queryObject;
};

module.exports = mongoose.model('Query', querySchema);
