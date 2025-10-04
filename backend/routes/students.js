const express = require('express');
const Student = require('../models/Student');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get student profile
router.get('/profile', auth, requireRole(['student']), async (req, res) => {
  try {
    console.log('Fetching student profile for user:', req.user._id);
    console.log('User role:', req.user.role);
    
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email profilePicture');
    
    console.log('Student profile found:', student);
    console.log('Student grade:', student?.grade);
    console.log('Student school:', student?.school);
    
    if (!student) {
      console.log('No student profile found, returning 404');
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create student profile
router.post('/', auth, requireRole(['student']), async (req, res) => {
  try {
    // Check if student profile already exists
    const existingStudent = await Student.findOne({ user: req.user._id });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student profile already exists' });
    }

    const studentData = {
      user: req.user._id,
      ...req.body
    };

    const student = new Student(studentData);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'firstName lastName email profilePicture');

    res.status(201).json({
      message: 'Student profile created successfully',
      student: populatedStudent
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student profile
router.put('/profile', auth, requireRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Update student fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        student[key] = req.body[key];
      }
    });

    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('user', 'firstName lastName email profilePicture');

    res.json({
      message: 'Student profile updated successfully',
      student: populatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students (admin only)
router.get('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .populate('user', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint to check all students (for debugging)
router.get('/debug/all', async (req, res) => {
  try {
    console.log('Fetching all students for debugging...');
    const students = await Student.find({})
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    console.log('All students found:', students.length);
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, {
        id: student._id,
        user: student.user,
        grade: student.grade,
        school: student.school,
        learningGoals: student.learningGoals,
        interests: student.interests
      });
    });

    res.json({
      count: students.length,
      students: students
    });
  } catch (error) {
    console.error('Debug get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



