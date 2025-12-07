const fetch = require('node-fetch');

async function testSubmission() {
  try {
    const response = await fetch('http://localhost:3000/api/ads/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        businessType: 'individual',
        adType: 'banner',
        adTitle: 'Test Ad',
        adDescription: 'This is a test ad description that is long enough.',
        targetAudience: 'Students and faculty members of UPSA',
        budget: '100',
        duration: '1-week',
        startDate: '2025-01-01',
        termsAccepted: true
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testSubmission();
