const mongoose = require('mongoose');
const SituacaoServidor = require('../models/SituacaoServidor');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const cleanDuplicates = async () => {
    await connectDB();

    try {
        console.log('Searching for duplicate vacation records to clean...');

        const duplicates = await SituacaoServidor.aggregate([
            { $match: { ASSUNTO_SIT: 'Férias' } },
            {
                $group: {
                    _id: {
                        IDFK_SERV: "$IDFK_SERV",
                        INICIO: "$INICIO_FERIAS_SIT",
                        FIM: "$FIM_FERIAS_SIT"
                    },
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }, // MongoDB _id
                    pk_ids: { $push: "$IDPK_SIT" } // Original PK
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} sets of duplicate records.`);

            let deletedCount = 0;
            for (const group of duplicates) {
                // Keep the first one, delete the rest
                const [keep, ...remove] = group.ids;
                console.log(`Keeping record ${keep}, removing ${remove.length} duplicates...`);

                await SituacaoServidor.deleteMany({ _id: { $in: remove } });
                deletedCount += remove.length;
            }

            console.log(`Successfully deleted ${deletedCount} duplicate records.`);
        } else {
            console.log('No duplicate vacation records found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

cleanDuplicates();
