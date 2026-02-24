const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data_converted.json');

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    if (data.tables) {
        console.log('Tables found:');
        data.tables.forEach(t => console.log(`- ${t.name}`));
    } else {
        console.log('No "tables" property found in JSON.');
    }
} catch (error) {
    console.error('Error reading JSON:', error.message);
}
