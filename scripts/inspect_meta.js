
import https from 'https';

const url = process.argv[2] || 'https://voiceofupsa.com/articles/beyond-the-lecture-hall-how-upsa-students-are-redefining-success';

const options = {
    headers: {
        'User-Agent': 'WhatsApp/2.21.12.21 A'
    }
};

console.log(`Fetching: ${url}`);

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Content-Length: ${res.headers['content-length']}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        
        console.log("\n--- Full Data ---");
        console.log(data);
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
