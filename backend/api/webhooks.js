// File: /backend/api/webhooks.js

const express = require('express');
const router = express.Router();

router.post('/stripe', async (req, res) => {
    try {
        const event = req.body;
        console.log('Stripe webhook received:', event);
        
        // Handle the Stripe event
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error handling Stripe webhook:', error);
        res.status(500).json({ error: 'An error occurred while processing the webhook.' });
    }
});

module.exports = router;
