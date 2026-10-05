const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('public/students-handbook-2018.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('public/handbook_raw.txt', data.text);
    console.log('Saved to public/handbook_raw.txt');
}).catch(console.error);
