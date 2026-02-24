const mongoose = require('mongoose');

const CalendarioSchema = new mongoose.Schema({
    data: { type: Date, required: true },
    dataFim: { type: Date },
    tipo: { type: String, enum: ['FERIADO', 'PONTO FACULTATIVO', 'RECESSO'], required: true },
    descricao: { type: String, required: true },
    global: { type: Boolean, default: true },
    servidores: [{ type: String }] // Array of Server IDs
});

module.exports = mongoose.model('Calendario', CalendarioSchema);
