const mongoose = require('mongoose');

const SituacaoServidorSchema = new mongoose.Schema({
    IDFK_SERV: String,
    IDPK_SIT: { type: String, unique: true },
    DATACAD_SIT: Date,
    HORACAD_SIT: String,
    STATUS_SIT: String,
    TIPODOC_SIT: String,
    NUMDOC_SIT: String,
    ANODOC_SIT: String,
    DATADOC_SIT: Date,
    RESPASSINATURA_SIT: String,
    INICIO_FERIAS_SIT: Date,
    FIM_FERIAS_SIT: Date,
    PA_ANO1_SIT: String,
    PA_ANO2_SIT: String,
    OBS_SIT: String,
    ASSUNTO_SIT: String,
    IMPRIMIR_DOSSIE_SIT: String
}, { strict: false });

module.exports = mongoose.model('SituacaoServidor', SituacaoServidorSchema);
