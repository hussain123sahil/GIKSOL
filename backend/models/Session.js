const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sessionType: {
    type: String,
    enum: ['Video Call', 'Phone Call', 'In-Person', 'Career Guidance', 'Technical Review', 'General Mentoring'],
    default: 'Video Call'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'upcoming', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  studentNotes: {
    type: String,
    trim: true
  },
  mentorNotes: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  studentFeedback: {
    type: String,
    trim: true
  },
  mentorFeedback: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: String,
    enum: ['student', 'mentor', 'system']
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ student: 1, status: 1 });
sessionSchema.index({ mentor: 1, status: 1 });
sessionSchema.index({ scheduledDate: 1 });
sessionSchema.index({ status: 1, scheduledDate: 1 });

// Virtual for formatted date
sessionSchema.virtual('formattedDate').get(function() {
  return this.scheduledDate.toISOString().split('T')[0];
});

// Virtual for formatted time
sessionSchema.virtual('formattedTime').get(function() {
  return this.scheduledDate.toTimeString().split(' ')[0].substring(0, 5);
});

// Pre-save middleware to update updatedAt
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if session is upcoming
sessionSchema.methods.isUpcoming = function() {
  const now = new Date();
  return this.scheduledDate > now && ['scheduled', 'upcoming'].includes(this.status);
};

// Method to check if session is completed
sessionSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

// Method to check if session is past
sessionSchema.methods.isPast = function() {
  const now = new Date();
  return this.scheduledDate < now && this.status !== 'cancelled';
};

module.exports = mongoose.model('Session', sessionSchema);
