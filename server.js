const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

function getContentType(filePath) {
    const extname = path.extname(filePath).toLowerCase();
    return mimeTypes[extname] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Handle root path
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Handle firebase-config.js with environment variable injection
    if (pathname === '/firebase-config.js') {
        try {
            let content = fs.readFileSync('firebase-config.js', 'utf8');
            
            // Replace placeholders with actual environment variables
            content = content.replace('__FIREBASE_API_KEY__', process.env.FIREBASE_API_KEY || '');
            content = content.replace('__FIREBASE_AUTH_DOMAIN__', process.env.FIREBASE_AUTH_DOMAIN || '');
            content = content.replace('__FIREBASE_DATABASE_URL__', process.env.FIREBASE_DATABASE_URL || '');
            content = content.replace('__FIREBASE_PROJECT_ID__', process.env.FIREBASE_PROJECT_ID || '');
            content = content.replace('__FIREBASE_STORAGE_BUCKET__', process.env.FIREBASE_STORAGE_BUCKET || '');
            content = content.replace('__FIREBASE_MESSAGING_SENDER_ID__', process.env.FIREBASE_MESSAGING_SENDER_ID || '');
            content = content.replace('__FIREBASE_APP_ID__', process.env.FIREBASE_APP_ID || '');
            
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(content);
            return;
        } catch (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('firebase-config.js not found');
            return;
        }
    }
    
    // Serve static files
    const filePath = path.join(__dirname, pathname);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        // Check if it's a directory
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }
            
            if (stats.isDirectory()) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('403 Forbidden');
                return;
            }
            
            // Serve the file
            const contentType = getContentType(filePath);
            const readStream = fs.createReadStream(filePath);
            
            res.writeHead(200, { 'Content-Type': contentType });
            readStream.pipe(res);
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});