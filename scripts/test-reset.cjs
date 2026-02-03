const fetch = require('node-fetch');

async function testReset() {
  const url = 'http://localhost:3000/api/auth/reset-password';
  const data = { email: 'akaye@voiceofupsa.com' }; // Use a real or plausible email

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testReset();
