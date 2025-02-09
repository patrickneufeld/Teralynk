// File Path: backend/api/encryptionRoutes.js

const express = require('express');
const router = express.Router();
const {
    encryptFile,
    decryptFile,
    generateSecureKey,
    encryptText,
    decryptText,
    analyzeEncryptionUsage, // AI-driven insights
} = require('../services/encryptionService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// Rate limiter for encryption routes
const encryptionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the encryption service. Please try again later.',
});

// **1️⃣ Encrypt a file**
router.post('/encrypt', encryptionRateLimiter, rbacMiddleware('user'), validateRequestBody(['filePath', 'encryptedFilePath']), async (req, res) => {
    try {
        const { filePath, encryptedFilePath } = req.body;

        const result = await encryptFile(filePath, encryptedFilePath);
        res.status(200).json({
            success: true,
            message: 'File encrypted successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error encrypting file:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while encrypting the file.',
        });
    }
});

// **2️⃣ Decrypt a file**
router.post('/decrypt', encryptionRateLimiter, rbacMiddleware('user'), validateRequestBody(['encryptedFilePath', 'decryptedFilePath', 'ivHex']), async (req, res) => {
    try {
        const { encryptedFilePath, decryptedFilePath, ivHex } = req.body;

        const result = await decryptFile(encryptedFilePath, decryptedFilePath, ivHex);
        res.status(200).json({
            success: true,
            message: 'File decrypted successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error decrypting file:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while decrypting the file.',
        });
    }
});

// **3️⃣ Generate a new secure encryption key**
router.get('/generate-key', encryptionRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    try {
        const newKey = await generateSecureKey();

        // Mask the key in the response to prevent direct exposure
        const maskedKey = `${newKey.slice(0, 4)}...${newKey.slice(-4)}`;
        res.status(200).json({
            success: true,
            message: 'New encryption key generated.',
            data: { maskedKey },
        });

        // AI-driven analysis
        await analyzeEncryptionUsage('generate-key', { keyLength: newKey.length });
    } catch (error) {
        console.error('Error generating encryption key:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while generating a new encryption key.',
        });
    }
});

// **4️⃣ Encrypt plain text**
router.post('/encrypt-text', encryptionRateLimiter, rbacMiddleware('user'), validateRequestBody(['text']), async (req, res) => {
    try {
        const { text } = req.body;

        const result = await encryptText(text);
        res.status(200).json({
            success: true,
            message: 'Text encrypted successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error encrypting text:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while encrypting the text.',
        });
    }
});

// **5️⃣ Decrypt plain text**
router.post('/decrypt-text', encryptionRateLimiter, rbacMiddleware('user'), validateRequestBody(['encryptedText', 'ivHex']), async (req, res) => {
    try {
        const { encryptedText, ivHex } = req.body;

        const result = await decryptText(encryptedText, ivHex);
        res.status(200).json({
            success: true,
            message: 'Text decrypted successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error decrypting text:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while decrypting the text.',
        });
    }
});

module.exports = router;
