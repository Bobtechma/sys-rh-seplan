const mongoose = require('mongoose');

const TipoAfastamentoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    ativo: {
        type: Boolean,
        default: true
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TipoAfastamento', TipoAfastamentoSchema);
