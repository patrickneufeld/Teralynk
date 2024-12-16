// File: /backend/api/admin.js

const express = require('express');
const router = express.Router();

router.get('/users', async (req, res) => {
    try {
        res.status(200).json({ message: 'List of all users retrieved successfully.' });
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ error: 'An error occurred while retrieving users.' });
    }
});

module.exports = router;
