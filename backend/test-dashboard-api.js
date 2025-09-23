const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const testDashboardAPI = async () => {
  try {
    console.log('🔄 Testing dashboard API...');
    
    const studentId = '68d2c326ac49758f6e269b4e';
    const response = await fetch(`http://localhost:5000/api/sessions/dashboard/${studentId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dashboard API working!');
      console.log('Quick Stats:', data.quickStats);
      console.log('Upcoming Sessions:', data.upcomingSessions.length);
      console.log('Completed Sessions:', data.completedSessions.length);
      console.log('Connections:', data.connections.length);
    } else {
      const error = await response.text();
      console.log('❌ Dashboard API failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Error testing dashboard API:', error.message);
  }
};

testDashboardAPI();
