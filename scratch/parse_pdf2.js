const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync("public/handbook_raw.txt", pdfParser.getRawTextContent());
    console.log("Saved to public/handbook_raw.txt");
});

pdfParser.loadPDF("public/students-handbook-2018.pdf");
