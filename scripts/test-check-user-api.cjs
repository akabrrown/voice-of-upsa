const fetch = require('node-fetch');

async function testCheckUserAPI() {
  const email = 'akayetb@gmail.com';
  console.log(`Testing /api/auth/check-user for email: ${email}`);

  try {
    const response = await fetch('http://localhost:3000/api/auth/check-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      console.error('API responded with status:', response.status);
      const text = await response.text();
      console.error('Response body:', text);
      return;
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.exists === true) {
      console.log('SUCCESS: User was correctly identified as existing.');
    } else {
      console.log('FAILURE: User was NOT identified as existing.');
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testCheckUserAPI();
