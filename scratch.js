const fs = require('fs');
const html = fs.readFileSync('scratch_error.html', 'utf8');

// The error message is usually inside a JSON chunk or explicitly listed in a text node.
// Next.js encodes server errors in an array of strings in the RSC payload.
const chunks = html.split('Error:');
if (chunks.length > 1) {
  for (let i = 1; i < Math.min(chunks.length, 5); i++) {
    console.log("Error part " + i + ":", chunks[i].substring(0, 200).replace(/\\n/g, '\n'));
  }
} else {
  console.log("Could not find 'Error:' string.");
}

// Check for anything resembling a stack trace
const traceRegex = /[A-Za-z0-9_]+\.(tsx?):\d+:\d+/g;
let match;
const seen = new Set();
while ((match = traceRegex.exec(html)) !== null) {
  if (!seen.has(match[0])) {
    console.log("Stack trace file:", match[0]);
    seen.add(match[0]);
  }
}
