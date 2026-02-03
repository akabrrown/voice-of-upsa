import fetch from 'node-fetch';

async function testPriceManipulation() {
  console.log('--- Testing Price Manipulation Vulnerability ---');
  
  const siteUrl = 'http://localhost:3000';
  const submissionId = 'test-id'; // Replace with a real approved submission ID if testing live
  
  console.log('Attempting to initialize payment with TAMPERED amount (1.00 GHS)...');
  
  try {
    const response = await fetch(`${siteUrl}/api/ads/payment/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissionId: submissionId,
        amount: 1, // TAMPERED AMOUNT
        email: 'test@example.com'
      }),
    });

    const data = await response.json();
    
    if (response.status === 404) {
      console.log('✅ Success: API correctly identifies submission not found (or ignores tampered amount and fails on ID).');
    } else if (response.ok) {
      console.log('⚠️ Warning: API initialized payment. CHECK IF IT USED 1.00 or the REAL budget!');
      console.log('Response payment_url:', data.payment_url);
    } else {
      console.log('API Response:', response.status, data.message);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPriceManipulation();
