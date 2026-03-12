const mongoose = require('mongoose');
require('dotenv').config();

const addIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sys-rh-seplan');
        console.log('MongoDB Conectado para indexação...');

        const Servidor = mongoose.model('Servidor', new mongoose.Schema({}, { strict: false }));
        const SituacaoServidor = mongoose.model('SituacaoServidor', new mongoose.Schema({}, { strict: false }));

        console.log('Criando índices para Servidores...');
        // Texto para busca global
        await Servidor.collection.createIndex({
            NOME_SERV: 'text',
            MATRICULA_SERV: 'text',
            CPF_SERV: 'text'
        }, { name: 'SearchIndex' });

        // Índices de filtro frequente
        await Servidor.collection.createIndex({ SETOR_LOTACAO_SERV: 1 });
        await Servidor.collection.createIndex({ ATIVO_SERV: 1 });
        await Servidor.collection.createIndex({ VINCULO_SERV: 1 });

        console.log('Criando índices para SituacaoServidor...');
        // FK e filtros de data
        await SituacaoServidor.collection.createIndex({ IDFK_SERV: 1 });
        await SituacaoServidor.collection.createIndex({ ASSUNTO_SIT: 1 });
        await SituacaoServidor.collection.createIndex({ INICIO_FERIAS_SIT: 1, FIM_FERIAS_SIT: 1 });

        console.log('Todos os índices foram criados com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('Erro ao criar índices:', err);
        process.exit(1);
    }
};

addIndexes();
