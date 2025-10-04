const mongoose = require('mongoose');
const dotenv = require('dotenv');
const config = require('./config/config');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Student = require('./models/Student');
const Mentor = require('./models/Mentor');
const Session = require('./models/Session');
const Connection = require('./models/Connection');

// Utility function to convert date to IST
function convertToIST(dateString) {
  const date = new Date(dateString);
  // Convert to IST by adjusting for timezone offset
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  return new Date(utc + istOffset);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    console.log('🔄 Clearing existing data...');
    await User.deleteMany({});
    await Student.deleteMany({});
    await Mentor.deleteMany({});
    await Session.deleteMany({});
    await Connection.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
};

const createUsers = async () => {
  console.log('🔄 Creating users...');
  
  const users = [
    // Students
    {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@example.com',
      password: 'password123',
      role: 'student',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@example.com',
      password: 'password123',
      role: 'student',
      profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Mike',
      lastName: 'Chen',
      email: 'mike.chen@example.com',
      password: 'password123',
      role: 'student',
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    // Mentors
    {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.brown@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Sarah',
      lastName: 'Davis',
      email: 'sarah.davis@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Emily',
      lastName: 'White',
      email: 'emily.white@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'David',
      lastName: 'Rodriguez',
      email: 'david.rodriguez@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Raj',
      lastName: 'Patel',
      email: 'raj.patel@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Lisa',
      lastName: 'Johnson',
      email: 'lisa.johnson@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Alex',
      lastName: 'Thompson',
      email: 'alex.thompson@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@example.com',
      password: 'password123',
      role: 'mentor',
      profilePicture: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face'
    },
    // Admin users
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@giksol.com',
      password: 'admin123',
      role: 'admin',
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@giksol.com',
      password: 'superadmin123',
      role: 'admin',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);
  }

  console.log('✅ Users created');
  return createdUsers;
};

const createStudentProfiles = async (users) => {
  console.log('🔄 Creating student profiles...');
  
  const students = users.filter(u => u.role === 'student');
  const studentProfiles = [];

  for (const student of students) {
    const profile = new Student({
      user: student._id,
      learningGoals: [
        'Learn JavaScript',
        'Career development',
        'Build real projects',
        'Get job ready'
      ],
      currentLevel: 'intermediate',
      interests: ['Web Development', 'Programming', 'Technology'],
      preferredLearningStyle: 'kinesthetic',
      timeCommitment: '3-5 hours/week',
      budget: { min: 0, max: 200 },
      bio: `Hi, I'm ${student.firstName} ${student.lastName}. I'm passionate about learning new technologies and building amazing applications!`
    });
    await profile.save();
    studentProfiles.push(profile);
  }

  console.log('✅ Student profiles created');
  return studentProfiles;
};

const createMentorProfiles = async (users) => {
  console.log('🔄 Creating mentor profiles...');
  
  const mentors = users.filter(u => u.role === 'mentor');
  const mentorProfiles = [];

  const mentorData = [
    {
      company: 'Google',
      position: 'Senior Software Engineer',
      expertise: ['JavaScript', 'React', 'Node.js', 'Career Guidance'],
      hourlyRate: 85,
      bio: 'I\'m a senior software engineer at Google with 8+ years of experience. I love helping developers grow their skills and advance their careers.',
      linkedinUrl: 'https://linkedin.com/in/janedoe',
      education: [{
        degree: 'Computer Science',
        institution: 'Stanford University',
        year: 2015
      }],
      certifications: [
        { name: 'AWS Certified Developer', issuer: 'Amazon Web Services', date: '2023-06-15' },
        { name: 'Google Cloud Professional', issuer: 'Google Cloud', date: '2023-03-20' }
      ]
    },
    {
      company: 'Microsoft',
      position: 'Principal Engineer',
      expertise: ['Python', 'Machine Learning', 'Data Science', 'Leadership'],
      hourlyRate: 95,
      bio: 'Principal engineer at Microsoft specializing in AI and machine learning. Passionate about mentoring the next generation of tech leaders.',
      linkedinUrl: 'https://linkedin.com/in/johnsmith',
      education: [{
        degree: 'PhD in Computer Science',
        institution: 'MIT',
        year: 2012
      }],
      certifications: [
        { name: 'Microsoft Azure Expert', issuer: 'Microsoft', date: '2023-08-10' },
        { name: 'TensorFlow Developer', issuer: 'Google', date: '2023-05-12' }
      ]
    },
    {
      company: 'Amazon',
      position: 'Tech Lead',
      expertise: ['React', 'TypeScript', 'AWS', 'System Design'],
      hourlyRate: 80,
      bio: 'Tech lead at Amazon with expertise in frontend development and cloud architecture. I enjoy sharing knowledge and helping others succeed.',
      linkedinUrl: 'https://linkedin.com/in/emilydavis',
      education: [{
        degree: 'Software Engineering',
        institution: 'UC Berkeley',
        year: 2016
      }],
      certifications: [
        { name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: '2023-07-22' },
        { name: 'React Professional', issuer: 'Meta', date: '2023-04-18' }
      ]
    },
    {
      company: 'Netflix',
      position: 'Staff Engineer',
      expertise: ['JavaScript', 'React', 'Node.js', 'Microservices'],
      hourlyRate: 90,
      bio: 'Staff engineer at Netflix working on scalable systems. I love mentoring developers and sharing insights about building large-scale applications.',
      linkedinUrl: 'https://linkedin.com/in/davidbrown',
      education: [{
        degree: 'Computer Science',
        institution: 'Carnegie Mellon',
        year: 2014
      }],
      certifications: [
        { name: 'Kubernetes Administrator', issuer: 'Cloud Native Computing Foundation', date: '2023-09-05' },
        { name: 'Docker Certified', issuer: 'Docker Inc.', date: '2023-02-14' }
      ]
    },
    {
      company: 'JP Morgan',
      position: 'Financial Adviser',
      expertise: ['Finance', 'Investment', 'Wealth Management', 'Financial Planning'],
      hourlyRate: 90,
      bio: 'Certified financial adviser helping clients achieve their financial goals. Expert in investment strategies and wealth management.',
      linkedinUrl: 'https://linkedin.com/in/sarahdavis',
      education: [{
        degree: 'MBA in Finance',
        institution: 'Wharton School',
        year: 2018
      }],
      certifications: [
        { name: 'CFA Charterholder', issuer: 'CFA Institute', date: '2022-08-15' },
        { name: 'CFP Professional', issuer: 'CFP Board', date: '2021-12-10' }
      ]
    },
    {
      company: 'Harvard',
      position: 'Leadership Coach',
      expertise: ['Leadership', 'Coaching', 'Management', 'Executive Development'],
      hourlyRate: 150,
      bio: 'Executive coach and leadership development expert with Harvard background. Helping leaders unlock their potential and drive organizational success.',
      linkedinUrl: 'https://linkedin.com/in/emilywhite',
      education: [{
        degree: 'PhD in Organizational Psychology',
        institution: 'Harvard University',
        year: 2010
      }],
      certifications: [
        { name: 'ICF Master Certified Coach', issuer: 'International Coaching Federation', date: '2023-01-20' },
        { name: 'Harvard Executive Education', issuer: 'Harvard Business School', date: '2022-06-30' }
      ]
    },
    {
      company: 'Nike',
      position: 'Marketing Lead',
      expertise: ['Marketing', 'Brand Strategy', 'Digital Marketing', 'Consumer Insights'],
      hourlyRate: 85,
      bio: 'Creative marketing professional with expertise in brand building and digital campaigns. Passionate about connecting brands with consumers.',
      linkedinUrl: 'https://linkedin.com/in/davidrodriguez',
      education: [{
        degree: 'Marketing & Communications',
        institution: 'Northwestern University',
        year: 2017
      }],
      certifications: [
        { name: 'Google Analytics Certified', issuer: 'Google', date: '2023-05-15' },
        { name: 'HubSpot Marketing', issuer: 'HubSpot', date: '2023-03-22' }
      ]
    },
    {
      company: 'Apple',
      position: 'Full Stack Developer',
      expertise: ['Full Stack', 'React', 'Node.js', 'iOS Development'],
      hourlyRate: 95,
      bio: 'Full stack developer with expertise in modern web technologies and mobile development. Love creating seamless user experiences.',
      linkedinUrl: 'https://linkedin.com/in/rajpatel',
      education: [{
        degree: 'Computer Science',
        institution: 'UC San Diego',
        year: 2019
      }],
      certifications: [
        { name: 'Apple Developer', issuer: 'Apple Inc.', date: '2023-07-10' },
        { name: 'React Developer', issuer: 'Meta', date: '2023-04-05' }
      ]
    },
    {
      company: 'Spotify',
      position: 'UX Designer',
      expertise: ['UX Design', 'UI Design', 'User Research', 'Product Design'],
      hourlyRate: 80,
      bio: 'User experience designer focused on creating intuitive and beautiful interfaces. Passionate about user-centered design and accessibility.',
      linkedinUrl: 'https://linkedin.com/in/lisajohnson',
      education: [{
        degree: 'Design & Human-Computer Interaction',
        institution: 'Carnegie Mellon',
        year: 2020
      }],
      certifications: [
        { name: 'Google UX Design', issuer: 'Google', date: '2023-06-18' },
        { name: 'Adobe Certified Expert', issuer: 'Adobe', date: '2023-02-28' }
      ]
    },
    {
      company: 'Tesla',
      position: 'Data Scientist',
      expertise: ['Data Science', 'Machine Learning', 'Python', 'Analytics'],
      hourlyRate: 110,
      bio: 'Data scientist specializing in machine learning and predictive analytics. Working on cutting-edge AI solutions for sustainable transportation.',
      linkedinUrl: 'https://linkedin.com/in/alexthompson',
      education: [{
        degree: 'PhD in Data Science',
        institution: 'Stanford University',
        year: 2019
      }],
      certifications: [
        { name: 'TensorFlow Developer', issuer: 'Google', date: '2023-08-12' },
        { name: 'AWS Machine Learning', issuer: 'Amazon Web Services', date: '2023-05-25' }
      ]
    },
    {
      company: 'Netflix',
      position: 'DevOps Engineer',
      expertise: ['DevOps', 'AWS', 'Kubernetes', 'Infrastructure'],
      hourlyRate: 105,
      bio: 'DevOps engineer with expertise in cloud infrastructure and automation. Passionate about building scalable and reliable systems.',
      linkedinUrl: 'https://linkedin.com/in/mariagarcia',
      education: [{
        degree: 'Computer Engineering',
        institution: 'Georgia Tech',
        year: 2018
      }],
      certifications: [
        { name: 'AWS DevOps Engineer', issuer: 'Amazon Web Services', date: '2023-09-08' },
        { name: 'Kubernetes Administrator', issuer: 'Cloud Native Computing Foundation', date: '2023-06-20' }
      ]
    }
  ];

  for (let i = 0; i < mentors.length; i++) {
    const mentor = mentors[i];
    const data = mentorData[i] || mentorData[0]; // Fallback to first data if not enough
    
    const profile = new Mentor({
      user: mentor._id,
      ...data,
      isAvailable: true,
      rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
      totalSessions: Math.floor(Math.random() * 50) + 20 // Random sessions 20-70
    });
    await profile.save();
    mentorProfiles.push(profile);
  }

  console.log('✅ Mentor profiles created');
  return mentorProfiles;
};

const createSessions = async (users, studentProfiles, mentorProfiles) => {
  console.log('🔄 Creating sessions...');
  
  const sessions = [];
  const now = new Date();
  
  // Get the first student (Alex Johnson) for the main dashboard
  const mainStudent = users.find(u => u.firstName === 'Alex');
  const mainStudentProfile = studentProfiles.find(s => s.user.toString() === mainStudent._id.toString());
  
  if (!mainStudent || !mainStudentProfile) {
    console.log('❌ Main student not found');
    return [];
  }

  const sessionData = [
    // Upcoming sessions
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'Jane')._id,
      title: 'JavaScript Fundamentals Review',
      description: 'Deep dive into JavaScript ES6+ features and best practices',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
      duration: 60,
      status: 'scheduled',
      notes: 'Focus on async/await and promises',
      meetingLink: 'https://meet.google.com/abc-defg-hij'
    },
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'John')._id,
      title: 'Career Planning Session',
      description: 'Discuss career goals and create a roadmap for growth',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
      duration: 90,
      status: 'scheduled',
      notes: 'Prepare resume and portfolio review',
      meetingLink: 'https://meet.google.com/xyz-1234-567'
    },
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'Emily')._id,
      title: 'React Component Architecture',
      description: 'Learn about React component patterns and state management',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
      duration: 75,
      status: 'scheduled',
      notes: 'Bring your current React project for review',
      meetingLink: 'https://meet.google.com/def-5678-901'
    },
    // Completed sessions
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'David')._id,
      title: 'Node.js Backend Development',
      description: 'Building REST APIs with Node.js and Express',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
      duration: 90,
      status: 'completed',
      notes: 'Great session on middleware and error handling',
      rating: 5,
      studentFeedback: 'Excellent explanation of concepts. Very helpful!',
      mentorFeedback: 'Alex is a quick learner and asks great questions.',
      completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'Jane')._id,
      title: 'JavaScript Interview Prep',
      description: 'Practice coding challenges and interview techniques',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
      duration: 60,
      status: 'completed',
      notes: 'Focused on data structures and algorithms',
      rating: 4,
      studentFeedback: 'Very helpful for interview preparation',
      mentorFeedback: 'Alex shows strong problem-solving skills.',
      completedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'John')._id,
      title: 'System Design Basics',
      description: 'Introduction to scalable system design principles',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)), // 14 days ago
      duration: 120,
      status: 'completed',
      notes: 'Covered load balancing and database design',
      rating: 5,
      studentFeedback: 'Mind-blowing session! Learned so much about architecture.',
      mentorFeedback: 'Alex has great potential in system design.',
      completedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    },
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'Emily')._id,
      title: 'React Hooks Deep Dive',
      description: 'Understanding useState, useEffect, and custom hooks',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)), // 21 days ago
      duration: 75,
      status: 'completed',
      notes: 'Built a custom hook for API calls',
      rating: 4,
      studentFeedback: 'Great hands-on approach to learning hooks',
      mentorFeedback: 'Alex implemented the custom hook perfectly!',
      completedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
    },
    // Add some cancelled sessions for testing
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'David')._id,
      title: 'Python Data Structures',
      description: 'Advanced Python data structures and algorithms',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
      duration: 90,
      status: 'cancelled',
      notes: 'Session was cancelled due to scheduling conflict',
      cancelledAt: convertToIST(new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000)), // 11 days ago
      cancelledBy: 'student',
      cancellationReason: 'Had an emergency and couldn\'t attend the session'
    },
    {
      student: mainStudent._id,
      mentor: users.find(u => u.firstName === 'Jane')._id,
      title: 'Advanced JavaScript Concepts',
      description: 'Deep dive into advanced JavaScript patterns',
      sessionType: 'Video Call',
      scheduledDate: convertToIST(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      duration: 60,
      status: 'cancelled',
      notes: 'Mentor had to cancel due to technical issues',
      cancelledAt: convertToIST(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)), // 6 days ago
      cancelledBy: 'mentor',
      cancellationReason: 'Technical difficulties with video conferencing setup'
    }
  ];

  for (const sessionInfo of sessionData) {
    const session = new Session(sessionInfo);
    await session.save();
    sessions.push(session);
  }

  console.log('✅ Sessions created');
  return sessions;
};

const createConnections = async (users, studentProfiles, mentorProfiles) => {
  console.log('🔄 Creating connections...');
  
  const connections = [];
  const mainStudent = users.find(u => u.firstName === 'Alex');
  
  if (!mainStudent) {
    console.log('❌ Main student not found for connections');
    return [];
  }

  const mentors = users.filter(u => u.role === 'mentor');
  
  for (const mentor of mentors) {
    const connection = new Connection({
      student: mainStudent._id,
      mentor: mentor._id,
      message: `Hi ${mentor.firstName}, I'd love to learn from your experience in software development!`,
      status: 'accepted',
      requestedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      respondedAt: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000), // Random date within last 25 days
      notes: 'Great mentor, very responsive and helpful!'
    });
    await connection.save();
    connections.push(connection);
  }

  console.log('✅ Connections created');
  return connections;
};

const main = async () => {
  try {
    await connectDB();
    await clearDatabase();
    
    const users = await createUsers();
    const studentProfiles = await createStudentProfiles(users);
    const mentorProfiles = await createMentorProfiles(users);
    const sessions = await createSessions(users, studentProfiles, mentorProfiles);
    const connections = await createConnections(users, studentProfiles, mentorProfiles);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${studentProfiles.length} student profiles`);
    console.log(`   - ${mentorProfiles.length} mentor profiles`);
    console.log(`   - ${sessions.length} sessions`);
    console.log(`   - ${connections.length} connections`);
    
    const mainStudent = users.find(u => u.firstName === 'Alex');
    console.log(`\n🔑 Main student ID for testing: ${mainStudent._id}`);
    console.log(`📧 Login with: alex.johnson@example.com / password123`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

main();
