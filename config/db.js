const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // If we have a connection, return it
    if (cached.conn) {
        return cached.conn;
    }

    // In production, DO NOT default to localhost to avoid timeouts
    let mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        if (process.env.NODE_ENV === 'production') {
            console.error('CRITICAL: MONGO_URI environment variable is not defined in Production.');
            // We return null instead of throwing to allow the server to start (for health checks)
            // But API calls needing DB will fail gracefully
            return null;
        } else {
            mongoURI = 'mongodb://localhost:27017/sys_rh_seplan';
            console.log('MONGO_URI not found, defaulting to localhost...');
        }
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable buffering to fail fast if not connected
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        };

        cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
            console.log('MongoDB Connected...');
            return mongoose;
        }).catch(err => {
            console.error('MongoDB Connection Error:', err.message);
            cached.promise = null; // Reset promise on failure so we can retry
            // Do not exit process
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('Error awaiting DB connection:', e);
    }

    return cached.conn;
};

module.exports = connectDB;
