const fs = require('fs');
const path = require('path');

const oldImports = [
  /from ['"]\.\.\/contexts\/AuthContext['"];/,
  /from ['"]\.\.\/contexts\/SecretsContext['"];/,
  /from ['"]\.\.\/contexts\/ThemeContext['"];/,
  /from ['"]\.\.\/contexts\/ModalContext['"];/,
  /from ['"]\.\.\/contexts\/NotificationContext['"];/,
  /from ['"]@\/contexts\/AuthContext['"];/,
  /from ['"]@\/contexts\/SecretsContext['"];/,
  /from ['"]@\/contexts\/ThemeContext['"];/,
  /from ['"]@\/contexts\/ModalContext['"];/,
  /from ['"]@\/contexts\/NotificationContext['"];/,
];

const newImport = 'from "@/contexts";';

function updateImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  
  oldImports.forEach(pattern => {
    updatedContent = updatedContent.replace(pattern, newImport);
  });

  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated imports in: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      walkDir(filePath);
    } else if (
      stat.isFile() && 
      (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts'))
    ) {
      updateImports(filePath);
    }
  });
}

// Start from src directory
walkDir(path.join(__dirname, '../src'));
