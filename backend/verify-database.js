const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Mentor = require('./models/Mentor');

// Load environment variables
dotenv.config();

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database collections...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('firstName lastName email role');
    console.log('👥 USERS COLLECTION:');
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });
    console.log('');

    // Get all students
    const students = await Student.find({}).populate('user', 'firstName lastName email');
    console.log('🎓 STUDENTS COLLECTION:');
    console.log(`Total students: ${students.length}`);
    students.forEach(student => {
      console.log(`- ${student.user.firstName} ${student.user.lastName} (${student.user.email})`);
      console.log(`  Learning Goals: ${student.learningGoals.join(', ')}`);
      console.log(`  Current Level: ${student.currentLevel}`);
      console.log(`  Interests: ${student.interests.join(', ')}`);
    });
    console.log('');

    // Get all mentors
    const mentors = await Mentor.find({}).populate('user', 'firstName lastName email');
    console.log('👨‍🏫 MENTORS COLLECTION:');
    console.log(`Total mentors: ${mentors.length}`);
    mentors.forEach(mentor => {
      console.log(`- ${mentor.user.firstName} ${mentor.user.lastName} (${mentor.user.email})`);
      console.log(`  Company: ${mentor.company}`);
      console.log(`  Position: ${mentor.position}`);
      console.log(`  Expertise: ${mentor.expertise.join(', ')}`);
      console.log(`  Hourly Rate: $${mentor.hourlyRate}`);
    });
    console.log('');

    console.log('✅ Database verification complete!');
    console.log('\n📊 SUMMARY:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Mentors: ${mentors.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyDatabase();
