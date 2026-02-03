const http = require('http');

const imageUrl = '/uploads/team/team-1766927225184-593913602.png';
const url = `http://localhost:3000${imageUrl}`;

console.log(`Checking if image is servable at: ${url}`);

http.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`Content-Length: ${res.headers['content-length']}`);
  
  if (res.statusCode === 200) {
    console.log('SUCCESS: Image is being served by the application.');
  } else {
    console.log('FAILURE: Image is NOT being served correctly.');
  }
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
