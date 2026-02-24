const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        console.log('Auth Middleware: No token received in x-auth-token header');
        return res.status(401).json({ msg: 'No token, authorization denied', debug: 'Header missing or empty' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secrettoken');
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth Middleware: Token verification failed:', err.message);
        const decoded = jwt.decode(token); // Decode without verifying to see timestamps
        const now = Math.floor(Date.now() / 1000);

        res.status(401).json({
            msg: 'Token is not valid',
            error: err.message,
            debug: {
                serverTime: now,
                iat: decoded ? decoded.iat : 'unknown',
                exp: decoded ? decoded.exp : 'unknown',
                diff: decoded ? (decoded.exp - now) : 'unknown'
            }
        });
    }
};
