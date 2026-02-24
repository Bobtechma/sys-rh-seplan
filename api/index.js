// Express 5 Handler
try {
    // Restore server import now that we know the issue
    const serverApp = require('../server');
    module.exports = serverApp;

} catch (error) {
    // Fallback if server.js itself crashes
    module.exports = (req, res) => {
        const body = JSON.stringify({
            error: 'Server Startup Error',
            message: 'Failed to load server.js',
            details: error.message,
            stack: error.stack
        });

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(body);
    };
}
