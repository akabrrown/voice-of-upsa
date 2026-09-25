const https = require('https');

https.get('https://www.voiceofupsa.com/articles/the-man-behind-the-voice-honouring-the-ceo-of-voice-of-upsa', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/<meta property="og:[^"]+" content="[^"]+"/g);
    console.log("All OG Tags:\n" + (matches ? matches.join('\n') : "None found"));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
