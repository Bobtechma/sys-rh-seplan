const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const Usuario = require('../models/Usuario');
require('dotenv').config();

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public (should be protected in prod, but public for initial setup)
router.post('/register', async (req, res) => {
    const { nome, email, senha, cargo, perfil } = req.body;

    try {
        let usuario = await Usuario.findOne({ email });

        if (usuario) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        usuario = new Usuario({
            nome,
            email,
            senha,
            cargo,
            perfil: perfil || 'viewer',
            mustChangePassword: true
        });

        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash(senha, salt);

        await usuario.save();

        const payload = {
            user: {
                id: usuario.id,
                perfil: usuario.perfil
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secrettoken',
            { expiresIn: '7d' }, // 7 days expiration
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: usuario.id, nome, email, cargo, perfil: usuario.perfil } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        let usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(senha, usuario.senha);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                perfil: usuario.perfil, // Add profile to payload
                mustChangePassword: usuario.mustChangePassword
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secrettoken',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        cargo: usuario.cargo,
                        perfil: usuario.perfil,
                        mustChangePassword: usuario.mustChangePassword
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user.id).select('-senha');
        res.json(usuario);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

const admin = require('../middleware/admin');

// @route   GET api/auth/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/users', [auth, admin], async (req, res) => {
    try {
        const users = await Usuario.find().select('-senha').sort({ dataCriacao: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/users
// @desc    Create a new user (Admin only)
// @access  Private/Admin
router.post('/users', [auth, admin], async (req, res) => {
    const { nome, email, senha, cargo, perfil } = req.body;

    try {
        let usuario = await Usuario.findOne({ email });

        if (usuario) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        usuario = new Usuario({
            nome,
            email,
            senha,
            cargo,
            perfil: perfil || 'viewer',
            mustChangePassword: true
        });

        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash(senha, salt);

        await usuario.save();

        res.json({ msg: 'User created successfully', user: { id: usuario.id, nome, email, cargo, perfil: usuario.perfil } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/auth/users/:id
// @desc    Delete a user (Admin only)
// @access  Private/Admin
router.delete('/users/:id', [auth, admin], async (req, res) => {
    try {
        // Prevent deleting self
        if (req.params.id === req.user.id) {
            return res.status(400).json({ msg: 'Cannot delete yourself' });
        }

        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ msg: 'User not found' });
        }

        await Usuario.findByIdAndDelete(req.params.id);

        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
    const { newPassword } = req.body;

    try {
        const usuario = await Usuario.findById(req.user.id);

        if (!usuario) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash(newPassword, salt);
        usuario.mustChangePassword = false;

        await usuario.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/users/:id', [auth, admin], async (req, res) => {
    const { nome, email, cargo, perfil } = req.body;

    try {
        let usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== usuario.email) {
            const emailExists = await Usuario.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ msg: 'Email already in use' });
            }
        }

        usuario.nome = nome || usuario.nome;
        usuario.email = email || usuario.email;
        usuario.cargo = cargo || usuario.cargo;
        usuario.perfil = perfil || usuario.perfil;

        await usuario.save();

        res.json({ msg: 'User updated successfully', user: { id: usuario.id, nome: usuario.nome, email: usuario.email, cargo: usuario.cargo } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private/Admin
router.post('/users/:id/reset-password', [auth, admin], async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash('123456', salt);
        usuario.mustChangePassword = true;

        await usuario.save();

        res.json({ msg: 'Password reset successfully to default (123456)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
