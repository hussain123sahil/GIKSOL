const axios = require('axios');

async function testRegistration() {
  try {
    console.log('🧪 Testing user registration...');
    
    const userData = {
      firstName: "Bob",
      lastName: "Wilson", 
      email: "bob@example.com",
      password: "password123",
      role: "mentor"
    };

    const response = await axios.post('http://localhost:5000/api/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('Error:', error.response?.data || error.message);
  }
}

testRegistration();
