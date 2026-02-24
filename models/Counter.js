const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    tipo: { type: String, required: true }, // 'AVF' or 'RCF'
    year: { type: Number, required: true },
    seq: { type: Number, default: 0 }
});

// Compound unique index: one counter per type per year
CounterSchema.index({ tipo: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Counter', CounterSchema);
