// File: /backend/services/encryptionService.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.randomBytes(32); // Secure random key (save this securely)
const IV_LENGTH = 16; // Initialization vector length

// Encrypt a file
const encryptFile = async (filePath, encryptedFilePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(encryptedFilePath);

    input.pipe(cipher).pipe(output);

    return new Promise((resolve, reject) => {
        output.on('finish', () => {
            console.log(`File encrypted successfully: ${encryptedFilePath}`);
            resolve({ encryptedFilePath, iv: iv.toString('hex') });
        });

        output.on('error', (error) => {
            console.error(`Error encrypting file: ${error.message}`);
            reject(error);
        });
    });
};

// Decrypt a file
const decryptFile = async (encryptedFilePath, decryptedFilePath, ivHex) => {
    if (!fs.existsSync(encryptedFilePath)) {
        throw new Error(`Encrypted file does not exist: ${encryptedFilePath}`);
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    const input = fs.createReadStream(encryptedFilePath);
    const output = fs.createWriteStream(decryptedFilePath);

    input.pipe(decipher).pipe(output);

    return new Promise((resolve, reject) => {
        output.on('finish', () => {
            console.log(`File decrypted successfully: ${decryptedFilePath}`);
            resolve({ decryptedFilePath });
        });

        output.on('error', (error) => {
            console.error(`Error decrypting file: ${error.message}`);
            reject(error);
        });
    });
};

// Generate a secure key (for initialization or key rotation)
const generateSecureKey = () => {
    const key = crypto.randomBytes(32).toString('hex');
    console.log('New encryption key generated:', key);
    return key;
};

module.exports = {
    encryptFile,
    decryptFile,
    generateSecureKey,
};
