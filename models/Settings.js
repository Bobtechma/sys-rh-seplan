const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    require2FA: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Settings', SettingsSchema);
