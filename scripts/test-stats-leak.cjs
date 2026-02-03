const fetch = require('node-fetch');

async function testStatsLeak() {
  console.log('Testing for data leak on /api/admin/dashboard-stats...');
  
  // This test should fail with 401 Unauthorized because we enabled withCMSSecurity
  try {
    const response = await fetch('http://127.0.0.1:3000/api/admin/dashboard-stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response Status:', response.status);
    const body = await response.text();
    console.log('Response Body:', body.substring(0, 200));
    
    if (response.status === 401) {
      console.log('SUCCESS: Dashboard stats are secured against public access!');
    } else if (response.status === 200) {
      console.log('FAILURE: DATA LEAK DETECTED! Dashboard stats are publicly accessible.');
    } else {
      console.log('INFO: Received status', response.status);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testStatsLeak();
