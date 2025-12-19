const http = require('http');

const data = JSON.stringify({
  title: "Test Story",
  content: "This is a test story for debugging purposes. It has enough characters to meet the minimum requirement for submission.",
  category: "general"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/anonymous-stories/submit',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', body);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
