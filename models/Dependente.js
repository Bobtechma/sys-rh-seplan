const mongoose = require('mongoose');

const DependenteSchema = new mongoose.Schema({
    IDFK_SERV: String,
    IDPK_DEP: { type: String, unique: true },
    DATACAD_DEP: Date,
    HORACAD_DEP: String,
    NOME_DEP: String,
    SEXO_DEP: String,
    NASCIMENTO_DEP: Date,
    ESCOLARIDADE_DEP: String
}, { strict: false });

module.exports = mongoose.model('Dependente', DependenteSchema);
