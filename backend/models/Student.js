const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  learningGoals: [{
    type: String,
    required: true,
    trim: true
  }],
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  interests: [{
    type: String,
    trim: true
  }],
  preferredLearningStyle: {
    type: String,
    enum: ['visual', 'auditory', 'kinesthetic', 'reading/writing'],
    default: 'visual'
  },
  timeCommitment: {
    type: String,
    enum: ['1-2 hours/week', '3-5 hours/week', '6-10 hours/week', '10+ hours/week'],
    default: '1-2 hours/week'
  },
  budget: {
    min: {
      type: Number,
      default: 0,
      min: [0, 'Minimum budget cannot be negative']
    },
    max: {
      type: Number,
      default: 100,
      min: [0, 'Maximum budget cannot be negative']
    }
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  grade: {
    type: String,
    trim: true,
    maxlength: [50, 'Grade cannot exceed 50 characters']
  },
  school: {
    type: String,
    trim: true,
    maxlength: [100, 'School name cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);

