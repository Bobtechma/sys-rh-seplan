/**
 * Script to sync SITUACAO_SERVIDOR records from data_converted.json into MongoDB.
 * Uses IDPK_SIT as the unique key for upsert (insert if missing, skip if exists).
 * 
 * Usage: node scripts/sync_situacao_servidor.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sys_rh_seplan';

// Date fields that need to be parsed
const DATE_FIELDS = ['DATACAD_SIT', 'DATADOC_SIT', 'FIM_FERIAS_SIT', 'INICIO_FERIAS_SIT', 'INICIO_CONCESSIVO_SIT', 'FIM_CONCESSIVO_SIT'];

// Fields to skip (not present in JSON or not relevant)
const SKIP_FIELDS = ['HORACAD_SIT']; // time-only field from old Access DB

function parseRow(row) {
    const doc = {};
    for (const [key, val] of Object.entries(row)) {
        if (SKIP_FIELDS.includes(key)) continue;

        if (DATE_FIELDS.includes(key)) {
            if (val && val !== '' && val !== null) {
                const d = new Date(val);
                doc[key] = isNaN(d.getTime()) ? null : d;
            } else {
                doc[key] = null;
            }
        } else if (key === 'IDFK_SERV' || key === 'IDPK_SIT' || key === 'PA_ANO1_SIT' || key === 'PA_ANO2_SIT' || key === 'ANODOC_SIT') {
            // Keep as string for consistency with existing schema
            doc[key] = val !== null && val !== undefined ? String(val) : null;
        } else {
            doc[key] = val;
        }
    }
    return doc;
}

async function main() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected!\n');

    // Load the SituacaoServidor model
    const SituacaoServidor = require('../models/SituacaoServidor');

    // Count existing records
    const existingCount = await SituacaoServidor.countDocuments();
    console.log(`Records currently in MongoDB: ${existingCount}`);

    // Load data_converted.json
    console.log('Loading data_converted.json (this may take a moment)...');
    const dataPath = path.join(__dirname, '..', 'data_converted.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const table = rawData.tables.find(t => t.name === 'SITUACAO_SERVIDOR');
    if (!table) {
        console.error('Table SITUACAO_SERVIDOR not found in data_converted.json!');
        process.exit(1);
    }

    console.log(`Records in data_converted.json: ${table.rows.length}\n`);

    // Get all existing IDPK_SIT values for fast lookup
    const existingDocs = await SituacaoServidor.find({}, { IDPK_SIT: 1, _id: 0 }).lean();
    const existingIds = new Set(existingDocs.map(d => String(d.IDPK_SIT)));
    console.log(`Unique IDPK_SIT values already in MongoDB: ${existingIds.size}`);

    // Filter to only new records
    const newRecords = [];
    let skippedCount = 0;
    let nullIdCount = 0;

    for (const row of table.rows) {
        const parsed = parseRow(row);

        if (!parsed.IDPK_SIT) {
            nullIdCount++;
            continue;
        }

        if (existingIds.has(String(parsed.IDPK_SIT))) {
            skippedCount++;
            continue;
        }

        newRecords.push(parsed);
    }

    console.log(`Records to skip (already exist): ${skippedCount}`);
    console.log(`Records with null IDPK_SIT (skipped): ${nullIdCount}`);
    console.log(`New records to insert: ${newRecords.length}\n`);

    if (newRecords.length === 0) {
        console.log('No new records to insert. Database is already up to date!');
        await mongoose.disconnect();
        return;
    }

    // Insert in batches
    const BATCH_SIZE = 200;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
        const batch = newRecords.slice(i, i + BATCH_SIZE);
        try {
            const result = await SituacaoServidor.insertMany(batch, { ordered: false });
            inserted += result.length;
        } catch (err) {
            // Handle duplicate key errors gracefully (in case of race condition)
            if (err.code === 11000 || (err.writeErrors && err.writeErrors.length > 0)) {
                const successCount = err.insertedDocs ? err.insertedDocs.length : (batch.length - (err.writeErrors ? err.writeErrors.length : 0));
                inserted += Math.max(0, successCount);
                errors += err.writeErrors ? err.writeErrors.length : 0;
                console.warn(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${successCount} inserted, ${err.writeErrors ? err.writeErrors.length : 0} duplicates skipped`);
            } else {
                console.error(`  Batch error:`, err.message);
                errors += batch.length;
            }
        }

        // Progress feedback
        const progress = Math.min(i + BATCH_SIZE, newRecords.length);
        process.stdout.write(`\r  Progress: ${progress}/${newRecords.length} processed...`);
    }

    console.log(`\n\n✅ Sync complete!`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped (duplicates): ${skippedCount + errors}`);

    // Final count
    const finalCount = await SituacaoServidor.countDocuments();
    console.log(`   Total records in MongoDB now: ${finalCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
