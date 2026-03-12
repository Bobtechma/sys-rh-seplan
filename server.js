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


// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
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
    app.use('/api', require('./routes/servidores'));
    app.use('/api', require('./routes/ferias'));
    app.use('/api', require('./routes/afastamentos'));
    app.use('/api', require('./routes/dashboard'));
    app.use('/api', require('./routes/utils'));
} catch (error) {
    console.error('CRITICAL ERROR: Failed to load modular API routes:', error);
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
