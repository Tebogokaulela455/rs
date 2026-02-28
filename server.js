const http = require('http');
const https = require('https');

const API_TOKEN = "E-PJWQoVlUg5Qudh1kSU6sfDgXtsozYzelR4xEbyK28";
const PORT = process.env.PORT || 3000;

// Centralized CORS Headers to ensure they are never missed
const getCorsHeaders = () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
});

const server = http.createServer((req, res) => {
    const corsHeaders = getCorsHeaders();

    // 1. Handle Pre-flight OPTIONS request explicitly
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    // 2. Attach CORS headers to all other incoming requests
    Object.keys(corsHeaders).forEach(key => res.setHeader(key, corsHeaders[key]));

    // 3. Root Route (Health Check for Render)
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Rea Sender Backend is LIVE');
        return;
    }

    // 4. Order API Route
    if (req.method === 'POST' && req.url === '/api/order') {
        let body = '';
        
        req.on('error', (err) => {
            console.error('Request Data Error:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request data' }));
        });

        req.on('data', chunk => { body += chunk.toString(); });
        
        req.on('end', () => {
            console.log("Processing Order for Rea Sender...");
            
            // Prevent server crash if frontend sends malformed JSON
            try {
                if (body) JSON.parse(body);
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body sent from client.' }));
                return;
            }

            const options = {
                hostname: 'reseller.openweb.co.za',
                path: '/api/v1/order/create',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // Adding Content-Length prevents upstream socket hangs
                    'Content-Length': Buffer.byteLength(body) 
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
                console.error("Upstream Connection Error:", e.message);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Upstream connection failed" }));
            });

            apiReq.write(body);
            apiReq.end();
        });
    } 
    // 5. Catch-all for 404
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Route not found", path: req.url }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});