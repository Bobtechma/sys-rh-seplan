const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const Servidor = require('../models/Servidor');
const SituacaoServidor = require('../models/SituacaoServidor');
const Dependente = require('../models/Dependente');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const importAccessData = async () => {
    await connectDB();

    try {
        const dataPath = path.resolve(__dirname, '../data_converted.json');

        if (!fs.existsSync(dataPath)) {
            console.error(`Error: File '${dataPath}' not found.`);
            console.log('Please run "node scripts/convert_access.js" first to generate the data file.');
            process.exit(1);
        }

        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        // Helper to parse dates from Access string format
        const parseDate = (d) => {
            if (!d) return null;
            const date = new Date(d);
            if (!isNaN(date.getTime())) return date;
            return null;
        };

        // Map of table names to Mongoose Models
        const modelMap = {
            'SERVIDOR': Servidor,
            'SITUACAO_SERVIDOR': SituacaoServidor,
            'DEPENDENTES': Dependente
        };

        for (const table of jsonData.tables) {
            const tableName = table.name;
            console.log(`Processing table: ${tableName} (${table.rows.length} rows)...`);

            let Model = modelMap[tableName];

            if (Model) {
                // Specific Model Import
                await Model.deleteMany({});
                console.log(`  > Cleared existing ${Model.modelName} collection.`);

                const rows = table.rows.map(row => {
                    const newRow = { ...row };
                    // Specific date parsing for known tables
                    if (tableName === 'SERVIDOR') {
                        if (newRow.ADMISSAO_SERV) newRow.ADMISSAO_SERV = parseDate(newRow.ADMISSAO_SERV);
                        if (newRow.NASCIMENTO_SERV) newRow.NASCIMENTO_SERV = parseDate(newRow.NASCIMENTO_SERV);
                        // Sincronizar Vínculo "Serviços Prestados"
                        if (newRow.SERVICO_PRESTADO_SERV && newRow.SERVICO_PRESTADO_SERV.toUpperCase() === 'SIM') {
                            newRow.VINCULO_SERV = 'SERVIÇOS PRESTADOS';
                        }
                    } else if (tableName === 'SITUACAO_SERVIDOR') {
                        if (newRow.DATACAD_SIT) newRow.DATACAD_SIT = parseDate(newRow.DATACAD_SIT);
                        if (newRow.DATADOC_SIT) newRow.DATADOC_SIT = parseDate(newRow.DATADOC_SIT);
                        if (newRow.INICIO_FERIAS_SIT) newRow.INICIO_FERIAS_SIT = parseDate(newRow.INICIO_FERIAS_SIT);
                        if (newRow.FIM_FERIAS_SIT) newRow.FIM_FERIAS_SIT = parseDate(newRow.FIM_FERIAS_SIT);
                    } else if (tableName === 'DEPENDENTES') {
                        if (newRow.DATACAD_DEP) newRow.DATACAD_DEP = parseDate(newRow.DATACAD_DEP);
                        if (newRow.NASCIMENTO_DEP) newRow.NASCIMENTO_DEP = parseDate(newRow.NASCIMENTO_DEP);
                    }
                    return newRow;
                });

                if (rows.length > 0) {
                    await Model.insertMany(rows);
                    console.log(`  > Imported ${rows.length} records into ${Model.modelName}.`);
                }

            } else {
                // Generic Import for other tables
                // We create a dynamic model for each table to store it in its own collection
                let DynamicModel;
                try {
                    DynamicModel = mongoose.model(tableName);
                } catch (e) {
                    DynamicModel = mongoose.model(tableName, new mongoose.Schema({}, { strict: false, collection: tableName }));
                }

                await DynamicModel.deleteMany({});
                console.log(`  > Cleared existing ${tableName} collection.`);

                if (table.rows.length > 0) {
                    // Batch insert
                    await DynamicModel.insertMany(table.rows);
                    console.log(`  > Imported ${table.rows.length} records into ${tableName}.`);
                }
            }
        }

        console.log('-----------------------------------');
        console.log('Data Migration Complete.');
        process.exit(0);

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

importAccessData();
