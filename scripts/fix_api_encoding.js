const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../routes/api.js');

try {
    const buffer = fs.readFileSync(targetPath);

    // Naive cleanup: remove null bytes (0x00) which are typical of UTF-16 LE when read as ASCII
    // This assumes the original file didn't use null bytes (standard text file).
    // Also need to handle the fact that the BEGINNING of the file was likely UTF-8 and the END is UTF-16.

    let content = '';

    // Scan buffer
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== 0x00) {
            content += String.fromCharCode(buffer[i]);
        }
    }

    // Now content should be readable text.
    // Fix double "module.exports = router;"
    // We want to keep the LAST one or just ensure efficient structure.

    // Strategy: Remove the *intermediate* 'module.exports = router;' that occurs before the dashboard route.

    const dashboardSig = '// @route   GET api/dashboard';

    if (content.includes(dashboardSig)) {
        console.log('Dashboard route found. Cleaning up...');

        // Split by the dashboard signature
        const parts = content.split(dashboardSig);

        if (parts.length > 2) {
            console.log('Warning: Multiple dashboard routes found?');
        }

        // In the first part (before dashboard), remove the trailing "module.exports = router;"
        // Regex to find "module.exports = router;" at the end of the string (ignoring whitespace)
        // Note: The file might have had it at the very end.

        let pre = parts[0];
        // Remove the last instance of module.exports = router; in the pre section
        const exportSig = 'module.exports = router;';
        const lastExportIndex = pre.lastIndexOf(exportSig);

        if (lastExportIndex !== -1) {
            console.log('Removing intermediate export...');
            pre = pre.substring(0, lastExportIndex) + pre.substring(lastExportIndex + exportSig.length);
        }

        content = pre + dashboardSig + parts.slice(1).join(dashboardSig);

    } else {
        console.log('Dashboard route NOT found in content? encoding fix might have failed.');
    }

    // Write back as UTF-8
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Fixed api.js encoding and structure.');

} catch (e) {
    console.error('Error:', e);
}
