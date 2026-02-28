const http = require('http');
const https = require('https');

// Official Reseller Token 
const API_TOKEN = "E-PJWQoVlUg5Qudh1kSU6sfDgXtsozYzelR4xEbyK28";

const server = http.createServer((req, res) => {
    // CORS Headers to allow your HTML frontend to connect 
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const PORT = process.env.PORT || 3000;

    if (req.method === 'OPTIONS') { 
        res.writeHead(204); 
        res.end(); 
        return; 
    }

    if (req.method === 'POST' && req.url === '/api/order') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            console.log("Incoming order data:", body); // DEBUG: Check what your HTML is sending

            const options = {
                hostname: 'reseller.openweb.co.za',
                path: '/api/v1/order/create',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const apiReq = https.request(options, (apiRes) => {
                let apiData = '';
                apiRes.on('data', d => { apiData += d; });
                
                apiRes.on('end', () => {
                    // This logs the ACTUAL error from OpenWeb to your terminal
                    if (apiRes.statusCode !== 200) {
                        console.error(`DASHBOARD ERROR (${apiRes.statusCode}):`, apiData);
                    } else {
                        console.log("Order Successful:", apiData);
                    }
                    
                    res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(apiData);
                });
            });

            apiReq.on('error', (e) => {
                console.error("Connection Error:", e.message);
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Could not connect to OpenWeb" }));
            });

            apiReq.write(body);
            apiReq.end();
        });
    }
});

server.listen(3000, () => {
    console.log('Rea Sender Bridge ACTIVE on http://localhost:3000');
    console.log('Press Ctrl+C to stop the server.');
});