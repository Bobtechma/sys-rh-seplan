const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    senha: {
        type: String,
        required: true
    },
    cargo: {
        type: String,
        default: 'Servidor'
    },
    perfil: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'viewer'
    },
    ativo: {
        type: Boolean,
        default: true
    },
    dataCriacao: {
        type: Date,
        default: Date.now
    },
    mustChangePassword: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
