// File: backend/scripts/fixCode.js

import { autoFixFile } from '../utils/xaiCodeFixer.js';

// Change this path to any file you want to fix
const filePath = '../../frontend/src/App.jsx';  // ✅ CORRECT PATH

(async () => {
    try {
        await autoFixFile(filePath);
        console.log(`Successfully fixed file: ${filePath}`);
    } catch (error) {
        console.error(`Error fixing file ${filePath}:`, error);
    }
})();
