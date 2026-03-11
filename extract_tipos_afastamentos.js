const fs = require('fs');

try {
    const rawData = fs.readFileSync('data_converted.json', 'utf-8');
    const data = JSON.parse(rawData);

    // Assuming data contains an array or an object with arrays. Let's find SituacaoServidor records if nested.
    let records = [];
    if (Array.isArray(data)) {
        records = data;
    } else if (data.SituacaoServidor) {
        records = data.SituacaoServidor;
    } else if (data.Afastamentos) {
        records = data.Afastamentos;
    } else {
        // Just extract all ASSUNTO_SIT from any nested level
        const extractAssuntos = (obj, acc) => {
            if (Array.isArray(obj)) {
                obj.forEach(item => extractAssuntos(item, acc));
            } else if (typeof obj === 'object' && obj !== null) {
                if (obj.ASSUNTO_SIT) acc.add(obj.ASSUNTO_SIT);
                if (obj.assunto) acc.add(obj.assunto);
                Object.values(obj).forEach(val => extractAssuntos(val, acc));
            }
        };
        const uniqueAssuntos = new Set();
        extractAssuntos(data, uniqueAssuntos);
        console.log("Unique Assuntos:");
        console.log(Array.from(uniqueAssuntos));
        process.exit(0);
    }

    // If it's a simple array
    const assuntos = new Set();
    records.forEach(r => {
        if (r.ASSUNTO_SIT) assuntos.add(r.ASSUNTO_SIT);
    });
    console.log("Unique Assuntos:");
    console.log(Array.from(assuntos));

} catch (e) {
    console.error("Error reading data:", e);
}
