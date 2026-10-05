const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/handbook_data.json', 'utf8'));

const toc = [];

for (const page of data) {
    const lines = page.content.split('\n');
    for (const line of lines) {
        // Look for CHAPTER ONE (1) or CHAPTER 1 or similar
        if (line.match(/^CHAPTER\s+[A-Z]+(\s*\(\d+\))?$/i)) {
            toc.push({ title: line.trim(), page: page.pageNumber });
        } else if (line.match(/^[0-9]+\.[0-9]+\s+[A-Z\s]+$/)) { // e.g. 1.0 GENERAL INFORMATION
             toc.push({ title: line.trim(), page: page.pageNumber });
        }
    }
}

console.log(toc);
