// fixImports.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath from 'url'

// To get the equivalent of __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Derive __dirname from import.meta.url

const projectRoot = path.join(__dirname, 'src'); // Now this works!

console.log(projectRoot);  // You can now use projectRoot as needed
