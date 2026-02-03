const fetch = require('node-fetch');

async function testPrivilegeEscalation() {
  console.log('Testing Privilege Escalation on /api/admin/sync-user...');
  
  // This test should fail with 401 if not authenticated, or 403 if authenticated but not admin
  try {
    const response = await fetch('http://127.0.0.1:3000/api/admin/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'admin',
        userId: 'some-uid'
      })
    });
    
    console.log('Response Status:', response.status);
    const body = await response.text();
    console.log('Response Body:', body.substring(0, 200));
    
    if (response.status === 401 || response.status === 403) {
      console.log('SUCCESS: Privilege escalation blocked!');
    } else {
      console.log('FAILURE: Endpoint might still be vulnerable or misconfigured');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPrivilegeEscalation();
