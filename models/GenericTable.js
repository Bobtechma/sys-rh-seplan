const mongoose = require('mongoose');

const GenericTableSchema = new mongoose.Schema({
    tableName: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed }
}, { strict: false });

module.exports = mongoose.model('GenericTable', GenericTableSchema);
