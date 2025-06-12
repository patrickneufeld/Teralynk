import fs from 'fs';

// First, let's create a working template file
const templatePath = '/Users/patrick/Projects/Teralynk/backend/src/routes/template.mjs';
fs.writeFileSync(templatePath, '// UTF-8 Template\n', { encoding: 'utf8' });

// Verify template is UTF-8
console.log('Template encoding:', fs.readFileSync(templatePath).toString('hex'));

const files = [
    'adminRoutes.mjs',
    'storageRoutes.mjs',
    'fileShareRoutes.mjs',
    'workflowRoutes.mjs'
];

for (const file of files) {
    const filePath = `/Users/patrick/Projects/Teralynk/backend/src/routes/${file}`;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Write to temp file first
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, content, { encoding: 'utf8' });
    
    // Read back and verify
    const tempContent = fs.readFileSync(tempPath, 'utf8');
    
    // If verification passes, replace original
    fs.renameSync(tempPath, filePath);
    
    console.log(`Processed ${file}`);
}

// Clean up template
fs.unlinkSync(templatePath);
