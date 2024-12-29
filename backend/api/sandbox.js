const express = require('express');
const router = express.Router();

router.post('/test', async (req, res) => {
    try {
        const { input } = req.body;
        const simulatedResult = `Processed: ${input}`;
        res.status(200).json({ success: true, simulatedResult });
    } catch (error) {
        console.error('Error in sandbox:', error);
        res.status(500).json({ error: 'An error occurred in the sandbox.' });
    }
});

module.exports = router;
