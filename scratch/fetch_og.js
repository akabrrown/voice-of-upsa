const https = require('https');

https.get('https://www.voiceofupsa.com/articles/the-man-behind-the-voice-honouring-the-ceo-of-voice-of-upsa', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/<meta property="og:image" content="([^"]+)"/g);
    console.log("OG Image Tags:", matches);
    
    // Also check twitter image
    const twitterMatches = data.match(/<meta name="twitter:image" content="([^"]+)"/g);
    console.log("Twitter Image Tags:", twitterMatches);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
