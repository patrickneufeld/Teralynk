// File: /backend/api/encryption.js

const express = require('express');
const router = express.Router();
const { encryptFile, decryptFile, generateSecureKey } = require('../services/encryptionService');

// Encrypt a file
router.post('/encrypt', async (req, res) => {
    try {
        const { filePath, encryptedFilePath } = req.body;

        if (!filePath || !encryptedFilePath) {
            return res.status(400).json({ error: 'File path and encrypted file path are required.' });
        }

        const result = await encryptFile(filePath, encryptedFilePath);
        res.status(200).json({ message: 'File encrypted successfully.', result });
    } catch (error) {
        console.error('Error encrypting file:', error);
        res.status(500).json({ error: 'An error occurred while encrypting the file.' });
    }
});

// Decrypt a file
router.post('/decrypt', async (req, res) => {
    try {
        const { encryptedFilePath, decryptedFilePath, ivHex } = req.body;

        if (!encryptedFilePath || !decryptedFilePath || !ivHex) {
            return res.status(400).json({ error: 'Encrypted file path, decrypted file path, and IV are required.' });
        }

        const result = await decryptFile(encryptedFilePath, decryptedFilePath, ivHex);
        res.status(200).json({ message: 'File decrypted successfully.', result });
    } catch (error) {
        console.error('Error decrypting file:', error);
        res.status(500).json({ error: 'An error occurred while decrypting the file.' });
    }
});

// Generate a new secure encryption key
router.get('/generate-key', (req, res) => {
    try {
        const newKey = generateSecureKey();
        res.status(200).json({ message: 'New encryption key generated.', key: newKey });
    } catch (error) {
        console.error('Error generating encryption key:', error);
        res.status(500).json({ error: 'An error occurred while generating a new encryption key.' });
    }
});

module.exports = router;
