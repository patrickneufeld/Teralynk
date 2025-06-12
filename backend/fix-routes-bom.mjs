import fs from 'fs';

const files = {
    // Same content as before
};

const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

for (const [filename, content] of Object.entries(files)) {
    const filePath = `/Users/patrick/Projects/Teralynk/backend/src/routes/${filename}`;
    const backupPath = `/Users/patrick/Projects/Teralynk/backend/src/routes/backup/${filename}`;
    
    // Backup existing file
    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
    }
    
    // Write new content with BOM
    const buffer = Buffer.concat([UTF8_BOM, Buffer.from(content, 'utf8')]);
    fs.writeFileSync(filePath, buffer);
    console.log(`Fixed ${filename}`);
}
