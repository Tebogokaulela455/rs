const http = require('http');
const https = require('https');

const API_TOKEN = "E-PJWQoVlUg5Qudh1kSU6sfDgXtsozYzelR4xEbyK28";

// RENDER FIX: Use process.env.PORT or default to 3000
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/order') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            console.log("Processing Order for Rea Sender...");

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
                    console.log(`OpenWeb Response (${apiRes.statusCode}):`, apiData);
                    res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(apiData);
                });
            });

            apiReq.on('error', (e) => {
                console.error("Connection Error:", e.message);
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Upstream connection failed" }));
            });

            apiReq.write(body);
            apiReq.end();
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: "Route not found" }));
    }
});

// Start server on the dynamic port Render provides
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live on port ${PORT}`);
});