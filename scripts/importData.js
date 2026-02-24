const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const Servidor = require('../models/Servidor');
const SituacaoServidor = require('../models/SituacaoServidor');
const Dependente = require('../models/Dependente');
const GenericTable = require('../models/GenericTable');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const importData = async () => {
    await connectDB();

    try {
        const dataPath = path.resolve(__dirname, '../data.json');
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        // Import SERVIDOR table
        const servidorTable = jsonData.tables.find(t => t.name === 'SERVIDOR');
        if (servidorTable) {
            console.log('Importing SERVIDOR...');
            const servidores = servidorTable.rows;

            await Servidor.deleteMany({});

            const cleanServidores = servidores.map(s => {
                const newS = { ...s };
                const parseDate = (d) => {
                    if (!d) return null;
                    const date = new Date(d);
                    if (!isNaN(date)) return date;
                    return null;
                };

                if (newS.ADMISSAO_SERV) newS.ADMISSAO_SERV = parseDate(newS.ADMISSAO_SERV);
                if (newS.NASCIMENTO_SERV) newS.NASCIMENTO_SERV = parseDate(newS.NASCIMENTO_SERV);

                return newS;
            });
            await Servidor.insertMany(cleanServidores);
            console.log('Servidores Imported!');
        }

        // Import SituacaoServidor
        const situacaoTable = jsonData.tables.find(t => t.name === 'SITUACAO_SERVIDOR');
        if (situacaoTable) {
            console.log('Importing SITUACAO_SERVIDOR...');
            await SituacaoServidor.deleteMany({});

            const cleanSituacoes = situacaoTable.rows.map(s => {
                const newS = { ...s };
                const parseDate = (d) => {
                    if (!d) return null;
                    const date = new Date(d);
                    if (!isNaN(date)) return date;
                    return null;
                };
                if (newS.DATACAD_SIT) newS.DATACAD_SIT = parseDate(newS.DATACAD_SIT);
                if (newS.DATADOC_SIT) newS.DATADOC_SIT = parseDate(newS.DATADOC_SIT);
                if (newS.INICIO_FERIAS_SIT) newS.INICIO_FERIAS_SIT = parseDate(newS.INICIO_FERIAS_SIT);
                if (newS.FIM_FERIAS_SIT) newS.FIM_FERIAS_SIT = parseDate(newS.FIM_FERIAS_SIT);
                return newS;
            });
            await SituacaoServidor.insertMany(cleanSituacoes);
            console.log('SituacaoServidor Imported!');
        }

        // Import Dependentes
        const dependentesTable = jsonData.tables.find(t => t.name === 'DEPENDENTES');
        if (dependentesTable) {
            console.log('Importing DEPENDENTES...');
            await Dependente.deleteMany({});

            const cleanDependentes = dependentesTable.rows.map(d => {
                const newD = { ...d };
                const parseDate = (d) => {
                    if (!d) return null;
                    const date = new Date(d);
                    if (!isNaN(date)) return date;
                    return null;
                };
                if (newD.DATACAD_DEP) newD.DATACAD_DEP = parseDate(newD.DATACAD_DEP);
                if (newD.NASCIMENTO_DEP) newD.NASCIMENTO_DEP = parseDate(newD.NASCIMENTO_DEP);
                return newD;
            });
            await Dependente.insertMany(cleanDependentes);
            console.log('Dependentes Imported!');
        }

        console.log('Data Import Success');
        process.exit();
    } catch (err) {
        console.error('Error with data import', err);
        process.exit(1);
    }
};

importData();
