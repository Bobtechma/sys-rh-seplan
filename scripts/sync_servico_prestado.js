const mongoose = require('mongoose');
const Servidor = require('../models/Servidor');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sys_rh_seplan';

async function syncVinculos() {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB Conectado');

        console.log('Iniciando sincronização de vínculos para "Serviços Prestados"...');

        // Encontrar servidores que têm SERVICO_PRESTADO_SERV = "SIM" (case insensitive)
        // e atualizar VINCULO_SERV para "SERVIÇOS PRESTADOS"
        const result = await Servidor.updateMany(
            {
                SERVICO_PRESTADO_SERV: { $regex: /^sim$/i }
            },
            {
                $set: { VINCULO_SERV: 'SERVIÇOS PRESTADOS' }
            }
        );

        console.log(`Sincronização concluída.`);
        console.log(`Documentos correspondentes: ${result.matchedCount}`);
        console.log(`Documentos modificados: ${result.modifiedCount}`);

        // Verificação rápida
        const count = await Servidor.countDocuments({ VINCULO_SERV: 'SERVIÇOS PRESTADOS' });
        console.log(`Total atual de 'SERVIÇOS PRESTADOS' no banco: ${count}`);

        mongoose.disconnect();
    } catch (err) {
        console.error('Erro na sincronização:', err);
        process.exit(1);
    }
}

syncVinculos();
