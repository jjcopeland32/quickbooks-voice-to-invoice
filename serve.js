/**
 * Simple HTTP server for development
 * Serves static files from the frontend directory
 * Adds CORS headers to allow requests from any origin
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const PORT = 3001;
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.pdf': 'application/pdf',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

/**
 * Proxy a request to the backend server
 * @param {Object} req - The client request
 * @param {Object} res - The client response
 * @param {String} targetPath - The path to proxy to
 */
function proxyRequest(req, clientRes, targetPath) {
    console.log(`Proxying request to: ${BACKEND_URL}${targetPath}`);
    
    const parsedUrl = url.parse(BACKEND_URL);
    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: targetPath,
        method: req.method,
        headers: {
            ...req.headers,
            host: parsedUrl.host
        }
    };
    
    // Create the proxy request
    const proxyReq = http.request(options, (proxyRes) => {
        // Copy status code
        clientRes.statusCode = proxyRes.statusCode;
        
        // Copy headers
        Object.keys(proxyRes.headers).forEach(key => {
            clientRes.setHeader(key, proxyRes.headers[key]);
        });
        
        // Pipe the response
        proxyRes.pipe(clientRes);
    });
    
    // Handle errors
    proxyReq.on('error', (err) => {
        console.error(`Proxy error: ${err.message}`);
        clientRes.statusCode = 500;
        clientRes.end(`Proxy error: ${err.message}`);
    });
    
    // If there's a request body, pipe it to the proxy request
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.pipe(proxyReq);
    } else {
        proxyReq.end();
    }
}

// Create the server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 204; // No Content
        res.end();
        return;
    }
    
    // Check if this is an API or OAuth request that should be proxied
    if (req.url.startsWith('/api/') || req.url.startsWith('/auth/')) {
        proxyRequest(req, res, req.url);
        return;
    }
    
    // Get the file path
    let filePath = path.join(FRONTEND_DIR, req.url);
    
    // If the URL ends with a slash, serve index.html
    if (filePath.endsWith('/') || filePath === FRONTEND_DIR) {
        filePath = path.join(filePath, 'index.html');
    }
    
    // Get the file extension
    const extname = path.extname(filePath);
    
    // Serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // If the file doesn't exist, return 404
            if (err.code === 'ENOENT') {
                console.error(`File not found: ${filePath}`);
                res.statusCode = 404;
                res.end('404 Not Found');
            } else {
                // For other errors, return 500
                console.error(`Error reading file: ${err}`);
                res.statusCode = 500;
                res.end('500 Internal Server Error');
            }
            return;
        }
        
        // Set the content type
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        
        // Send the file
        res.end(data);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving files from ${FRONTEND_DIR}`);
    console.log(`Proxying API and OAuth requests to ${BACKEND_URL}`);
}); 