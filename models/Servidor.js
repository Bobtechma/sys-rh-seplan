const mongoose = require('mongoose');

const ServidorSchema = new mongoose.Schema({
    IDPK_SERV: { type: String, unique: true },
    NOME_SERV: String,
    MATRICULA_SERV: String,
    CPF_SERV: String,
    CARGO_EFETIVO_SERV: String,
    CARGO_COMISSIONADO_SERV: String,
    FUNCAO_SP_SERV: String,
    SETOR_LOTACAO_SERV: String,
    ATIVO_SERV: String,
    ADMISSAO_SERV: Date,
    NASCIMENTO_SERV: Date,
    VINCULO_SERV: String,
    TURNO_SERV: String, // Matutino, Vespertino, Integral
    SEXO_SERV: String,
    ESTADO_CIVIL_SERV: String,
    NOME_PAI_SERV: String,
    NOME_MAE_SERV: String,
    TIPO_SANGUINEO_SERV: String,
    FATOR_SERV: String,

    SERVICO_PRESTADO_SERV: String, // Campo importado para identificar vínculo "Serviços Prestados"

    // Documentos
    RG_SERV: String,
    OE_RG_SERV: String, // Orgao Emissor RG (implied or separate?)
    PISPASEP_SERV: String,
    TITULO_ELEITORAL_SERV: String,
    ZONA_SERV: String,
    SECAO_SERV: String,
    CNH_SERV: String,
    VALIDADE_CNH_SERV: Date,
    CTPS_SERV: String, // Carteira de Trabalho
    CERT_RESERV_SERV: String, // Reservista

    // Endereço e Contato
    ENDERECO_SERV: String,
    BAIRRO_SERV: String,
    CIDADE_SERV: String,
    ESTADO_SERV: String, // UF
    CEP_SERV: String,
    EMAIL_SERV: String,
    FONES_SERV: String,
    FONES_TRAB_SERV: String,

    // Dados Bancários
    BANCO_SERV: String,
    AGENCIA_SERV: String,
    CONTACORRENTE_SERV: String,
    TRABALHA_SEXTA_TARDE: { type: Boolean, default: false },

    // Dados Funcionais Adicionais
    SIMBOLO_SERV: String, // DAS-3, etc.
    ORG_ORIGEM_SERV: String,
    CEDIDO_SERV: String, // "true"/"false" or boolean string
    CHEFE_SERV: String,
    DATACAD_SERV: Date, // Data de cadastro original?

    // Educação
    ESCOLARIDADE_SERV: String,
    CURSO_SERV: String,

    OBS_DADOS_PESSOAIS_SERV: String, // Additional notes from legacy

    SITUACAO_SERV: String, // Mapped from LST_STATUS_SIT_SERV if needed, or just stored as is
    OBS_SERV: String, // Field for backward compatibility or sticky note
    OBSERVACOES: [{
        conteudo: String,
        categoria: String,
        data: { type: Date, default: Date.now },
        autor: String
    }],
    ANEXOS: [{
        nome: String,
        caminho: String, // Kept for backward compatibility or alternative use
        conteudo: String, // Base64 Data URI
        tipo: String,
        tamanho: Number,
        data: { type: Date, default: Date.now }
    }]
}, { strict: false, timestamps: true });

module.exports = mongoose.model('Servidor', ServidorSchema);
