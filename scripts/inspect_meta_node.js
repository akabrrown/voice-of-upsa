
const fs = require('fs');

const html = fs.readFileSync('article_debug_3.html', 'utf8');

console.log("--- Meta Tags ---");
const metaRegex = /<meta\s+([^>]*name="([^"]*)"|[^>]*property="([^"]*)")[^>]*content="([^"]*)"/g;
let match;
while ((match = metaRegex.exec(html)) !== null) {
    const name = match[2] || match[3];
    const content = match[4];
    console.log(`${name}: ${content}`);
}

const titleMatch = html.match(/<title>([^<]*)<\/title>/);
console.log("\n--- Title ---");
console.log(titleMatch ? titleMatch[1] : "No title found");
