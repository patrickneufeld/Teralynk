// File: /backend/services/encryptionService.js

const crypto = require('crypto');
const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const { recordActivity } = require('./activityLogService');

// **Load environment variables**
dotenv.config();

// **AWS Secrets Manager Configuration**
const secretsManager = new AWS.SecretsManager({
    region: process.env.AWS_REGION || 'us-east-1',
});

// **Encryption configuration**
const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';
const IV_LENGTH = 16; // Initialization vector length (16 bytes for AES)

// **Helper function to get the encryption key from AWS Secrets Manager**
const getEncryptionKey = async () => {
    try {
        const secretName = process.env.ENCRYPTION_SECRET_NAME || 'encryption_key';
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        const secret = data.SecretString ? JSON.parse(data.SecretString) : data.SecretBinary.toString('ascii');
        return Buffer.from(secret.encryption_key, 'hex');
    } catch (error) {
        console.error('Error retrieving encryption key from AWS Secrets Manager:', error);
        throw new Error('Failed to retrieve encryption key.');
    }
};

// **Encrypt a file**
const encryptFile = async (filePath, encryptedFilePath) => {
    try {
        if (!filePath || !encryptedFilePath) throw new Error('File path and encrypted file path are required.');

        const fileExists = await fs.stat(filePath).catch(() => false);
        if (!fileExists) throw new Error(`File does not exist: ${filePath}`);

        const encryptionKey = await getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

        const input = fs.createReadStream(filePath);
        const output = fs.createWriteStream(encryptedFilePath);

        input.pipe(cipher).pipe(output);

        return new Promise((resolve, reject) => {
            output.on('finish', async () => {
                await recordActivity('system', 'encrypt', filePath, { encryptedFilePath });
                console.log(`File encrypted successfully: ${encryptedFilePath}`);
                resolve({ encryptedFilePath, iv: iv.toString('hex') });
            });

            output.on('error', (error) => {
                console.error(`Error encrypting file: ${error.message}`);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption process failed.');
    }
};

// **Decrypt a file**
const decryptFile = async (encryptedFilePath, decryptedFilePath, ivHex) => {
    try {
        if (!encryptedFilePath || !decryptedFilePath || !ivHex) throw new Error('Encrypted file path, decrypted file path, and IV are required.');

        const fileExists = await fs.stat(encryptedFilePath).catch(() => false);
        if (!fileExists) throw new Error(`Encrypted file does not exist: ${encryptedFilePath}`);

        const encryptionKey = await getEncryptionKey();
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);

        const input = fs.createReadStream(encryptedFilePath);
        const output = fs.createWriteStream(decryptedFilePath);

        input.pipe(decipher).pipe(output);

        return new Promise((resolve, reject) => {
            output.on('finish', async () => {
                await recordActivity('system', 'decrypt', encryptedFilePath, { decryptedFilePath });
                console.log(`File decrypted successfully: ${decryptedFilePath}`);
                resolve({ decryptedFilePath });
            });

            output.on('error', (error) => {
                console.error(`Error decrypting file: ${error.message}`);
                reject(error);
            });
        });
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption process failed.');
    }
};

// **Generate a secure key for AES-256 encryption**
const generateSecureKey = () => {
    const key = crypto.randomBytes(32).toString('hex'); // 256 bits = 32 bytes
    console.log('New encryption key generated:', key);
    return key;
};

// **Encrypt text**
const encryptText = async (text) => {
    try {
        if (!text) throw new Error('Text to encrypt is required.');

        const encryptionKey = await getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

        const encryptedText = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('hex');
        return { encryptedText, iv: iv.toString('hex') };
    } catch (error) {
        console.error('Error encrypting text:', error);
        throw new Error('Text encryption failed.');
    }
};

// **Decrypt text**
const decryptText = async (encryptedText, ivHex) => {
    try {
        if (!encryptedText || !ivHex) throw new Error('Encrypted text and IV are required.');

        const encryptionKey = await getEncryptionKey();
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);

        const decryptedText = Buffer.concat([
            decipher.update(Buffer.from(encryptedText, 'hex')),
            decipher.final(),
        ]).toString('utf8');

        return decryptedText;
    } catch (error) {
        console.error('Error decrypting text:', error);
        throw new Error('Text decryption failed.');
    }
};

module.exports = {
    encryptFile,
    decryptFile,
    generateSecureKey,
    encryptText,
    decryptText,
};
