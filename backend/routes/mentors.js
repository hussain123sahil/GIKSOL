const express = require('express');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();


// Helper function to convert time string to minutes
function timeToMinutes(timeString) {
  try {
    if (!timeString || typeof timeString !== 'string') {
      console.error('Invalid timeString:', timeString);
      return 0;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Invalid time format:', timeString);
      return 0;
    }
    return hours * 60 + minutes;
  } catch (error) {
    console.error('Error in timeToMinutes:', error, 'for timeString:', timeString);
    return 0;
  }
}

// Get all mentors
router.get('/', async (req, res) => {
  try {
    const { expertise, search, minRate, maxRate, available } = req.query;
    
    let query = { isAvailable: true };
    
    // Filter by expertise
    if (expertise) {
      query.expertise = { $in: expertise.split(',') };
    }
    
    // Filter by hourly rate range
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = parseFloat(minRate);
      if (maxRate) query.hourlyRate.$lte = parseFloat(maxRate);
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by availability
    if (available === 'true') {
      query.isAvailable = true;
    }

    const mentors = await Mentor.find(query)
      .populate('user', 'firstName lastName email profilePicture')
      .sort({ rating: -1, totalSessions: -1 });

    res.json(mentors);
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Filter mentors by availability (date and time) - MUST be before /:id route
router.get('/available', async (req, res) => {
  try {
    const { date, time, duration = 60 } = req.query;
    
    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    // Parse the date to get day of week
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Parse time to get start and end times
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Calculate end time based on duration
    const endMinutes = hours * 60 + minutes + parseInt(duration);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    // Find mentors available on the requested day
    const mentors = await Mentor.find({
      isAvailable: true,
      [`availability.${dayOfWeek}.isAvailable`]: true
    })
    .populate('user', 'firstName lastName email profilePicture')
    .sort({ rating: -1, totalSessions: -1 });

    // Client-side filtering for time slots
    let filteredMentors = [];
    
    try {
      filteredMentors = mentors.filter(mentor => {
        try {
          const dayAvailability = mentor.availability[dayOfWeek];
          
          if (!dayAvailability || !dayAvailability.isAvailable) {
            return false;
          }
          
          if (!dayAvailability.timeSlots || dayAvailability.timeSlots.length === 0) {
            return false;
          }
          
          return dayAvailability.timeSlots.some(slot => {
            try {
              if (!slot.isActive) {
                return false;
              }
              
              // Validate slot has required properties
              if (!slot.startTime || !slot.endTime) {
                return false;
              }
              
              // Convert time strings to minutes for easier comparison
              const slotStartMinutes = timeToMinutes(slot.startTime);
              const slotEndMinutes = timeToMinutes(slot.endTime);
              const requestStartMinutes = timeToMinutes(startTime);
              const requestEndMinutes = timeToMinutes(endTime);
              
              // Check if conversion was successful
              if (slotStartMinutes === 0 || slotEndMinutes === 0 || requestStartMinutes === 0 || requestEndMinutes === 0) {
                return false;
              }
              
              // Check if the requested time falls within the slot
              return requestStartMinutes >= slotStartMinutes && requestEndMinutes <= slotEndMinutes;
            } catch (error) {
              return false;
            }
          });
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      // Fallback: return all mentors if filtering fails
      filteredMentors = mentors;
    }

    res.json(filteredMentors);
  } catch (error) {
    console.error('Filter mentors by availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mentor by ID
router.get('/:id', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
      .populate('user', 'firstName lastName email profilePicture');
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    res.json(mentor);
  } catch (error) {
    console.error('Get mentor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create mentor profile
router.post('/', auth, requireRole(['mentor']), async (req, res) => {
  try {
    // Check if mentor profile already exists
    const existingMentor = await Mentor.findOne({ user: req.user._id });
    if (existingMentor) {
      return res.status(400).json({ message: 'Mentor profile already exists' });
    }

    const mentorData = {
      user: req.user._id,
      ...req.body
    };

    const mentor = new Mentor(mentorData);
    await mentor.save();

    const populatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'firstName lastName email profilePicture');

    res.status(201).json({
      message: 'Mentor profile created successfully',
      mentor: populatedMentor
    });
  } catch (error) {
    console.error('Create mentor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update mentor profile
router.put('/profile', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ user: req.user._id });
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    // Update mentor fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        mentor[key] = req.body[key];
      }
    });

    await mentor.save();

    const populatedMentor = await Mentor.findById(mentor._id)
      .populate('user', 'firstName lastName email profilePicture');

    res.json({
      message: 'Mentor profile updated successfully',
      mentor: populatedMentor
    });
  } catch (error) {
    console.error('Update mentor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search mentors by expertise
router.get('/search/expertise', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const mentors = await Mentor.find({
      expertise: { $regex: q, $options: 'i' },
      isAvailable: true
    })
    .populate('user', 'firstName lastName email profilePicture')
    .limit(10);

    res.json(mentors);
  } catch (error) {
    console.error('Search mentors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



