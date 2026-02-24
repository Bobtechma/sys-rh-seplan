const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sys_rh_seplan';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const fixUsers = async () => {
    await connectDB();

    try {
        // 1. Delete the typo user
        const typoEmail = 'admin@seplan.me.gov.br';
        await Usuario.deleteOne({ email: typoEmail });
        console.log(`Deleted user: ${typoEmail}`);

        // 2. Fix the correct admin user
        const correctEmail = 'admin@seplan.ma.gov.br';
        const user = await Usuario.findOne({ email: correctEmail });

        if (user) {
            user.cargo = 'Admin'; // Fix role
            user.perfil = 'admin'; // Fix profile
            user.mustChangePassword = false; // Stop prompting if they already changed it
            // If they haven't changed it, they might need to reset it manually or we can set it to true.
            // But user complained about "every time", so let's set to false to unblock them.
            // If they forgot the password, they can ask to reset.
            await user.save();
            console.log(`Updated user ${correctEmail}: Role -> Admin, Perfil -> admin, MustChange -> false`);
        } else {
            console.log(`User ${correctEmail} not found!`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixUsers();
