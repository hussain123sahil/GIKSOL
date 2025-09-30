const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Mentor = require('../models/Mentor');
const User = require('../models/User');

// Apply authentication to all routes
router.use(auth);

// Get mentor availability
router.get('/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;

    // Find mentor by user ID
    const mentor = await Mentor.findOne({ user: mentorId }).populate('user');
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Return availability data (default structure if not set)
    const availability = mentor.availability || {
      monday: { isAvailable: false, timeSlots: [] },
      tuesday: { isAvailable: false, timeSlots: [] },
      wednesday: { isAvailable: false, timeSlots: [] },
      thursday: { isAvailable: false, timeSlots: [] },
      friday: { isAvailable: false, timeSlots: [] },
      saturday: { isAvailable: false, timeSlots: [] },
      sunday: { isAvailable: false, timeSlots: [] }
    };

    res.json({
      mentorId,
      availability,
      lastUpdated: mentor.availabilityLastUpdated || null
    });

  } catch (error) {
    console.error('Error getting mentor availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update mentor availability
router.put('/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { availability } = req.body;

    // Validate availability data
    const validation = validateAvailabilityData(availability);
    
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    // Find mentor by user ID
    const mentor = await Mentor.findOne({ user: mentorId });
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Update availability
    mentor.availability = availability;
    mentor.availabilityLastUpdated = new Date();
    
    await mentor.save();

    res.json({
      message: 'Availability updated successfully',
      availability: mentor.availability,
      lastUpdated: mentor.availabilityLastUpdated
    });

  } catch (error) {
    console.error('Error updating mentor availability:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Get mentor availability for public view (for students)
router.get('/public/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;

    // Find mentor by user ID
    const mentor = await Mentor.findOne({ user: mentorId }).populate('user');
    
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Return only available time slots for public view
    const publicAvailability = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      const dayData = mentor.availability?.[day];
      if (dayData && dayData.isAvailable && dayData.timeSlots.length > 0) {
        publicAvailability[day] = {
          isAvailable: true,
          timeSlots: dayData.timeSlots.filter(slot => slot.isActive).map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        };
      } else {
        publicAvailability[day] = {
          isAvailable: false,
          timeSlots: []
        };
      }
    });

    res.json({
      mentorId,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`,
      availability: publicAvailability
    });

  } catch (error) {
    console.error('Get public mentor availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to validate availability data
function validateAvailabilityData(availability) {
  if (!availability || typeof availability !== 'object') {
    return { isValid: false, message: 'Invalid availability data' };
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const dayData = availability[day];
    
    if (!dayData || typeof dayData !== 'object') {
      return { isValid: false, message: `Invalid data for ${day}` };
    }

    if (typeof dayData.isAvailable !== 'boolean') {
      return { isValid: false, message: `isAvailable must be boolean for ${day}` };
    }

    if (!Array.isArray(dayData.timeSlots)) {
      return { isValid: false, message: `timeSlots must be array for ${day}` };
    }

    if (dayData.isAvailable && dayData.timeSlots.length === 0) {
      return { isValid: false, message: `At least one time slot required for ${day}` };
    }

    // Validate time slots
    for (const slot of dayData.timeSlots) {
      if (!slot.startTime || !slot.endTime) {
        return { isValid: false, message: `Time slots must have startTime and endTime for ${day}` };
      }

      if (typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') {
        return { isValid: false, message: `Time values must be strings for ${day}` };
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return { isValid: false, message: `Invalid time format for ${day}. Use HH:MM format` };
      }

      // Validate that end time is after start time
      const startTime = new Date(`2000-01-01T${slot.startTime}`);
      const endTime = new Date(`2000-01-01T${slot.endTime}`);
      
      if (endTime <= startTime) {
        return { isValid: false, message: `End time must be after start time for ${day}` };
      }
    }
  }

  return { isValid: true, message: '' };
}

module.exports = router;
