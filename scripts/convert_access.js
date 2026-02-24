const ADODB = require('node-adodb');
const fs = require('fs');
const path = require('path');

// Configuration
// Allow passing filename as argument: node scripts/convert_access.js [filename]
const DB_FILENAME = process.argv[2] || 'SYSRH.mdb';
const DB_PATH = path.resolve(__dirname, '..', DB_FILENAME);
const OUTPUT_FILE = 'data_converted.json';

console.log(`Target Database: ${DB_PATH}`);

// Check if DB exists
if (!fs.existsSync(DB_PATH)) {
    console.error(`Error: Database file '${DB_PATH}' not found.`);
    console.log('Usage: node scripts/convert_access.js [filename.mdb]');
    process.exit(1);
}

// Check for lock file
const lockFile = DB_PATH.replace(/\.(mdb|accdb)$/i, '.ldb');
if (fs.existsSync(lockFile)) {
    console.warn(`WARNING: Lock file '${lockFile}' detected.`);
    console.warn('The database appears to be open. Please close Access to avoid errors.');
}

// Initialize ADODB connection
const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${DB_PATH};`);

async function convert() {
    try {
        console.log('Connecting to database...');

        let tables = [];

        // Try to get tables via Schema
        try {
            const tablesSchema = await connection.schema(20); // adSchemaTables
            tables = tablesSchema.filter(t => t.TABLE_TYPE === 'TABLE' || t.TABLE_TYPE === 'LINK');
            console.log(`Found ${tables.length} tables via Schema.`);
        } catch (schemaError) {
            console.error('Warning: Could not list tables via Schema (Permission Denied).');
            console.error('Error:', schemaError.process ? schemaError.process.message : schemaError.message);
            console.log('Attempting to read MSysObjects directly...');
        }

        // If Schema failed or we want to check links, try MSysObjects
        if (tables.length === 0) {
            try {
                // Type 1 = Local Table, Type 6 = Linked Table
                const objects = await connection.query('SELECT Name, Type, Database FROM MSysObjects WHERE Type = 1 OR Type = 6');
                tables = objects.map(obj => ({
                    TABLE_NAME: obj.Name,
                    TABLE_TYPE: obj.Type === 6 ? 'LINK' : 'TABLE',
                    LINK_SOURCE: obj.Database
                }));
                console.log(`Found ${tables.length} tables via MSysObjects.`);
            } catch (msysError) {
                console.error('Failed to read MSysObjects:', msysError.process ? msysError.process.message : msysError.message);
            }
        }

        if (tables.length === 0) {
            console.error('CRITICAL: Could not find any tables. Check file permissions or password.');
            return;
        }

        const output = { tables: [] };

        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            const tableType = table.TABLE_TYPE;

            // Skip system tables if they got in
            if (tableName.startsWith('MSys')) continue;

            console.log(`Processing ${tableName} [${tableType}]...`);
            if (table.LINK_SOURCE) console.log(`   -> Linked to: ${table.LINK_SOURCE}`);

            try {
                // Get columns
                const columnsSchema = await connection.schema(4, [null, null, tableName]);
                const columns = columnsSchema.map(col => ({
                    name: col.COLUMN_NAME,
                    type: col.DATA_TYPE
                }));

                // Get rows
                const rowsData = await connection.query(`SELECT * FROM [${tableName}]`);

                const rows = rowsData.map(row => {
                    const formattedRow = {};
                    for (const col of columns) {
                        const val = row[col.name];
                        if (val instanceof Date) {
                            formattedRow[col.name] = val.toString();
                        } else if (val === null || val === undefined) {
                            formattedRow[col.name] = null;
                        } else {
                            formattedRow[col.name] = val.toString();
                        }
                    }
                    return formattedRow;
                });

                output.tables.push({
                    name: tableName,
                    columns: columns,
                    rows: rows
                });
                console.log(`   -> Success: ${rows.length} rows.`);

            } catch (tableError) {
                const msg = tableError.process ? tableError.process.message : tableError.message;
                console.error(`   -> FAILED: ${msg}`);
                if (msg.includes('Sem permissão')) {
                    console.log('      (Likely a security restriction or broken link)');
                }
            }
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
        console.log(`\nConversion Complete. Saved to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

convert();
