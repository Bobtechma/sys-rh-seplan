const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors({
    origin: '*', // Allow all origins for now (or configure specific domains)
    allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));

// Debug Auth Route - To verify what the server sees
app.get('/api/debug-auth', (req, res) => {
    const token = req.header('x-auth-token');
    const jwt = require('jsonwebtoken');

    if (!token) {
        return res.json({ status: 'no_token_received', headers: req.headers });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secrettoken');
        return res.json({ status: 'valid', user: decoded.user });
    } catch (err) {
        return res.json({ status: 'invalid', error: err.message, token_snippet: token.substring(0, 10) + '...' });
    }
});

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

// Diagnostics Route (To pinpoint 500 errors)
app.get('/api/diagnose', async (req, res) => {
    const mongoose = require('mongoose');
    const diagnostics = {
        timestamp: new Date(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            MONGO_URI_CONFIGURED: !!process.env.MONGO_URI,
        },
        mongoose: {
            readyState: require('mongoose').connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
            host: require('mongoose').connection.host
        },
        modules: {}
    };

    // Try requiring routes to see if they crash
    try {
        require('./routes/api');
        diagnostics.modules.apiRoute = 'Loaded successfully';
    } catch (e) {
        diagnostics.modules.apiRoute = { error: e.message, stack: e.stack };
    }

    try {
        require('./routes/auth');
        diagnostics.modules.authRoute = 'Loaded successfully';
    } catch (e) {
        diagnostics.modules.authRoute = { error: e.message, stack: e.stack };
    }

    // Try basic DB ping
    try {
        if (mongoose.connection.readyState === 1) {
            const admin = new mongoose.mongo.Admin(mongoose.connection.db);
            const pingResult = await admin.ping();
            diagnostics.mongoose.ping = pingResult;
        } else {
            diagnostics.mongoose.ping = 'Skipped (Not Connected)';
        }
    } catch (e) {
        diagnostics.mongoose.ping = { error: e.message };
    }

    res.json(diagnostics);
});



// Debug Files Route
app.get('/api/debug-files', (req, res) => {
    const fs = require('fs');
    const path = require('path');

    const listDir = (dir, depth = 0) => {
        if (depth > 3) return ['(max depth allowed)'];
        try {
            const files = fs.readdirSync(dir);
            const result = [];
            for (const file of files) {
                if (file === 'node_modules') {
                    result.push('node_modules/');
                    continue;
                }
                const fullPath = path.join(dir, file);
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    result.push({ [file]: listDir(fullPath, depth + 1) });
                } else {
                    result.push(file);
                }
            }
            return result;
        } catch (e) {
            return `[Error: ${e.message}]`;
        }
    };

    res.json({
        cwd: process.cwd(),
        dirname: __dirname,
        files: listDir(process.cwd())
    });
});

// Force UTF-8 for all responses
app.use((req, res, next) => {
    res.charset = 'utf-8';
    next();
});

// Serve static files from the React app
const frontendPath = path.join(__dirname, 'frontend', 'dist');

// Mount assets explicitly to avoid ambiguity
app.use('/assets', express.static(path.join(frontendPath, 'assets')));
app.use(express.static(frontendPath));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global Middleware: Check DB Connection for API routes
app.use('/api', async (req, res, next) => {
    // Prevent ALL API routes from being cached by browser or Vercel Edge
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Skip check for health/debug check
    if (req.path === '/health' || req.path === '/debug-status' || req.path === '/diagnose') return next();

    // Ensure DB is connected before proceeding
    try {
        await connectDB();
    } catch (e) {
        console.error('Middleware Connection Error:', e);
    }
    next();
});

// Define Routes - AUTH must be mounted BEFORE /api to avoid interception
try {
    app.use('/api/auth', require('./routes/auth'));
} catch (error) {
    console.error('CRITICAL ERROR: Failed to load Auth routes:', error);
}

try {
    app.use('/api/settings', require('./routes/settings'));
} catch (error) {
    console.error('CRITICAL ERROR: Failed to load Settings routes:', error);
}

try {
    app.use('/api', require('./routes/api'));
} catch (error) {
    console.error('CRITICAL ERROR: Failed to load API routes:', error);
    app.use('/api', (req, res, next) => {
        if (req.path === '/debug-status') return next();
        res.status(500).json({ error: 'API routes failed to load', details: error.message });
    });
}



// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    // Check if request is for API, if so, don't return index.html
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ msg: 'API route not found' });
    }

    // Ignore static assets (mismatched extensions) to avoid "MIME type" confusion
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return res.status(404).send('Not Found');
    }

    const indexHtmlPath = path.join(frontendPath, 'index.html');

    // Check if file exists to avoid crash
    const fs = require('fs');
    if (fs.existsSync(indexHtmlPath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.sendFile(indexHtmlPath);
    } else {
        console.error(`Error: File not found at ${indexHtmlPath}`);
        res.status(404).send('Application loading... (Frontend assets missing or path incorrect)');
    }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;
