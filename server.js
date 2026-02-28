const http = require('http');
const https = require('https');

const API_TOKEN = "E-PJWQoVlUg5Qudh1kSU6sfDgXtsozYzelR4xEbyK28";
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // Standard CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle pre-flight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // FIX: Root Route to prevent 404 on deployment/health checks
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Rea Sender Backend is LIVE');
        return;
    }

    // Route to handle order creation
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
    } 
    // Otherwise, return 404
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Route not found", path: req.url }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live on port ${PORT}`);
});