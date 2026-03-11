const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Settings = require('../models/Settings');

// Helper to ensure a settings document exists
const getSettings = async () => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings({});
        await settings.save();
    }
    return settings;
};

// @route   GET api/settings
// @desc    Get global system settings
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/settings/2fa
// @desc    Toggle Global 2FA Requirement
// @access  Private/Admin
router.post('/2fa', [auth, admin], async (req, res) => {
    try {
        const settings = await getSettings();

        // Toggle the current state
        settings.require2FA = !settings.require2FA;
        await settings.save();

        res.json({
            msg: `Autenticação em Duas Etapas foi ${settings.require2FA ? 'ativada' : 'desativada'}.`,
            require2FA: settings.require2FA
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
