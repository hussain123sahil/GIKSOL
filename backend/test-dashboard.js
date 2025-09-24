const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Student = require('./models/Student');
const Mentor = require('./models/Mentor');
const Session = require('./models/Session');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const createTestData = async () => {
  try {
    console.log('🔄 Creating test data...');

    // Create test users
    const studentUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: 'student'
    });
    await studentUser.save();

    const mentorUser = new User({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
      role: 'mentor'
    });
    await mentorUser.save();

    // Create student profile
    const student = new Student({
      user: studentUser._id,
      learningGoals: ['Learn JavaScript', 'Career development'],
      currentLevel: 'intermediate',
      interests: ['Web Development', 'Programming'],
      preferredLearningStyle: 'hands-on',
      timeCommitment: '2-3 hours/week',
      budget: { min: 0, max: 200 },
      bio: 'Hi, I\'m John. I\'m excited to learn new technologies!'
    });
    await student.save();

    // Create mentor profile
    const mentor = new Mentor({
      user: mentorUser._id,
      company: 'Tech Corp',
      position: 'Senior Developer',
      expertise: ['JavaScript', 'React', 'Node.js'],
      hourlyRate: 75,
      bio: 'Hi, I\'m Jane. I love helping others grow in their tech careers!',
      linkedinUrl: 'https://linkedin.com/in/janesmith',
      education: [{
        degree: 'Computer Science',
        institution: 'University of Technology',
        year: 2015
      }],
      certifications: ['AWS Certified Developer']
    });
    await mentor.save();

    // Create test sessions
    const upcomingSession = new Session({
      student: studentUser._id,
      mentor: mentorUser._id,
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming',
      sessionType: 'Video Call',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      duration: 60,
      status: 'scheduled',
      notes: 'Focus on ES6 features'
    });
    await upcomingSession.save();

    const completedSession = new Session({
      student: studentUser._id,
      mentor: mentorUser._id,
      title: 'React Components',
      description: 'Understanding React component lifecycle',
      sessionType: 'Video Call',
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      duration: 90,
      status: 'completed',
      notes: 'Great session on React hooks',
      rating: 5,
      studentFeedback: 'Very helpful and clear explanations',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });
    await completedSession.save();

    console.log('✅ Test data created successfully!');
    console.log(`Student ID: ${studentUser._id}`);
    console.log(`Mentor ID: ${mentorUser._id}`);
    console.log(`Upcoming Session ID: ${upcomingSession._id}`);
    console.log(`Completed Session ID: ${completedSession._id}`);

    return {
      studentId: studentUser._id,
      mentorId: mentorUser._id
    };

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
};

const testDashboardEndpoint = async (studentId) => {
  try {
    console.log('🔄 Testing dashboard endpoint...');
    
    const response = await fetch(`http://localhost:5000/api/sessions/dashboard/${studentId}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Dashboard endpoint working!');
      console.log('Quick Stats:', data.quickStats);
      console.log('Upcoming Sessions:', data.upcomingSessions.length);
      console.log('Completed Sessions:', data.completedSessions.length);
      console.log('Connections:', data.connections.length);
    } else {
      console.log('❌ Dashboard endpoint failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error testing dashboard endpoint:', error.message);
  }
};

const main = async () => {
  try {
    await connectDB();
    const { studentId } = await createTestData();
    
    // Wait a moment for the server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testDashboardEndpoint(studentId);
    
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

main();
