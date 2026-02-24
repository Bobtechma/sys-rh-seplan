const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    data: {
        type: Date,
        required: true
    },
    tipo: {
        type: String,
        enum: ['Feriado Nacional', 'Feriado Regional', 'Ponto Facultativo'],
        default: 'Feriado Nacional'
    },
    descricao: {
        type: String
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Evento', EventoSchema);
