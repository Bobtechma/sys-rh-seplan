
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
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

const resetPassword = async () => {
    await connectDB();

    try {
        const email = 'admin@seplan.ma.gov.br';
        const password = 'admin';

        let user = await Usuario.findOne({ email });

        if (!user) {
            console.log('User not found, creating...');
            user = new Usuario({
                nome: 'Admin User',
                email,
                cargo: 'Admin'
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.senha = await bcrypt.hash(password, salt);
        user.mustChangePassword = false;

        await user.save();
        console.log(`Password for ${email} reset to '${password}'`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
