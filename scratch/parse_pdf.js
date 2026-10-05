const fs = require('fs');
const pdfParse = require('pdf-parse');

const dataBuffer = fs.readFileSync('public/students-handbook-2018.pdf');

pdfParse(dataBuffer).then(function(data) {
    console.log(`Total Pages: ${data.numpages}`);
    fs.writeFileSync('public/handbook_raw.txt', data.text);
    console.log('Saved to public/handbook_raw.txt');
}).catch(err => {
    console.error(err);
});
