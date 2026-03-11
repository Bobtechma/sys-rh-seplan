const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const Usuario = require('../models/Usuario');
const Settings = require('../models/Settings');
require('dotenv').config();
const crypto = require('crypto');
const sendEmail = require('../utils/email');

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
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }

        const isMatch = await bcrypt.compare(senha, usuario.senha);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciais inválidas' });
        }

        // Check if global 2FA is required
        let settings = await Settings.findOne();
        if (settings && settings.require2FA) {
            // Generate 6-digit code
            const twoFactorCode = crypto.randomInt(100000, 999999).toString();

            // Hash token before saving
            usuario.twoFactorCode = crypto.createHash('sha256').update(twoFactorCode).digest('hex');
            usuario.twoFactorExpire = Date.now() + 10 * 60 * 1000; // 10 minutes valitity
            await usuario.save();

            const message = `Seu código de verificação para acesso ao Sys RH SEPLAN é:\n\n${twoFactorCode}\n\nEste código expirará em 10 minutos.`;

            try {
                await sendEmail({
                    email: usuario.email,
                    subject: 'Sys RH SEPLAN - Código de Verificação 2FA',
                    message
                });
                return res.json({ requires2FA: true, email: usuario.email, msg: 'Código de verificação enviado para o seu e-mail.' });
            } catch (err) {
                console.error(err);
                usuario.twoFactorCode = undefined;
                usuario.twoFactorExpire = undefined;
                await usuario.save();
                return res.status(500).json({ msg: 'Erro ao enviar e-mail de verificação (2FA).' });
            }
        }

        // If 2FA is NOT required, proceed normally
        const payload = {
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                perfil: usuario.perfil,
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
                    user: payload.user
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

        const payload = {
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                perfil: usuario.perfil,
                mustChangePassword: false
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secrettoken',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ msg: 'Password updated successfully', token });
            }
        );
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

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        usuario.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        // Set expire (10 minutes)
        usuario.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await usuario.save();

        // Create reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `Um administrador solicitou a redefinição de senha para sua conta.\n\nPor favor, acesse o link abaixo para redefinir sua senha:\n\n${resetUrl}\n\nEste link expirará em 10 minutos.`;

        try {
            await sendEmail({
                email: usuario.email,
                subject: 'Sys RH SEPLAN - Redefinição de Senha',
                message
            });

            res.json({ msg: 'Link de redefinição enviado com sucesso para o e-mail do usuário' });
        } catch (err) {
            console.error(err);
            usuario.resetPasswordToken = undefined;
            usuario.resetPasswordExpire = undefined;
            await usuario.save();

            return res.status(500).json({ msg: 'Erro ao enviar e-mail de redefinição' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/refresh-token
// @desc    Refresh user token
// @access  Private
router.get('/refresh-token', auth, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user.id);
        if (!usuario) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const payload = {
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                perfil: usuario.perfil,
                mustChangePassword: usuario.mustChangePassword
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secrettoken',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(404).json({ msg: 'Não existe usuário com este e-mail.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        usuario.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        // Set expire (10 minutes)
        usuario.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await usuario.save();

        // Create reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `Você solicitou a redefinição de senha.\n\nPor favor, acesse o link abaixo para redefinir sua senha:\n\n${resetUrl}\n\nSe você não solicitou isso, por favor ignore este e-mail. Este link expirará em 10 minutos.`;

        try {
            await sendEmail({
                email: usuario.email,
                subject: 'Sys RH SEPLAN - Redefinição de Senha',
                message
            });

            res.status(200).json({ msg: 'E-mail enviado' });
        } catch (err) {
            console.error(err);
            usuario.resetPasswordToken = undefined;
            usuario.resetPasswordExpire = undefined;
            await usuario.save();

            return res.status(500).json({ msg: 'Erro ao enviar e-mail' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const usuario = await Usuario.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({ msg: 'Token inválido ou expirado.' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash(req.body.senha, salt);
        usuario.mustChangePassword = false;

        // Clear reset fields
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpire = undefined;

        await usuario.save();

        res.status(200).json({ msg: 'Senha atualizada com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/verify-2fa
// @desc    Validate 2FA code and issue JWT
// @access  Public
router.post('/verify-2fa', async (req, res) => {
    const { email, code } = req.body;

    try {
        // Find user by email
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(400).json({ msg: 'Sessão inválida. Volte ao login.' });
        }

        if (!usuario.twoFactorCode || usuario.twoFactorExpire < Date.now()) {
            return res.status(400).json({ msg: 'Código expirado. Por favor, faça login novamente.' });
        }

        // Hash the incoming code to compare
        const hashedCode = crypto.createHash('sha256').update(code.toString()).digest('hex');

        if (hashedCode !== usuario.twoFactorCode) {
            return res.status(400).json({ msg: 'Código inválido.' });
        }

        // Code is correct: Wipe data
        usuario.twoFactorCode = undefined;
        usuario.twoFactorExpire = undefined;
        await usuario.save();

        // Issue JWT token
        const payload = {
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo,
                perfil: usuario.perfil,
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
                    user: payload.user
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
