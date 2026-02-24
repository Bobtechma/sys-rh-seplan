const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const resetAdmin = async () => {
    await connectDB();

    const email = 'admin@seplan.ma.gov.br';
    const password = 'admin';

    try {
        let user = await Usuario.findOne({ email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (user) {
            console.log('Admin user found. Updating password...');
            user.senha = hashedPassword;
            user.mustChangePassword = true; // Force password change
            await user.save();
            console.log('Password updated successfully.');
        } else {
            console.log('Admin user not found. Creating new user...');
            user = new Usuario({
                nome: 'Admin User',
                email,
                senha: hashedPassword,
                cargo: 'Admin',
                ativo: true,
                mustChangePassword: true
            });
            await user.save();
            console.log('Admin user created successfully.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error resetting admin:', err);
        process.exit(1);
    }
};

resetAdmin();
