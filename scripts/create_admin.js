const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const connectDB = require('../config/db');
require('dotenv').config();

const createAdmin = async () => {
    await connectDB();

    try {
        let admin = await Usuario.findOne({ email: 'admin@seplan.ma.gov.br' });

        if (admin) {
            console.log('Admin user already exists');
            process.exit();
        }

        admin = new Usuario({
            nome: 'Administrador',
            email: 'admin@seplan.ma.gov.br',
            senha: 'admin', // Will be hashed
            cargo: 'Administrador',
            ativo: true
        });

        const salt = await bcrypt.genSalt(10);
        admin.senha = await bcrypt.hash(admin.senha, salt);

        await admin.save();
        console.log('Admin user created successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
