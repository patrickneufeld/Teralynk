// File: /backend/api/billing.js

const express = require('express');
const router = express.Router();
const { createSubscription, getBillingInfo } = require('../services/billingService');

// **Create a subscription for a user**
router.post('/create-subscription', async (req, res) => {
    try {
        const { userId, planId } = req.body;

        if (!userId || !planId) {
            return res.status(400).json({ error: 'User ID and plan ID are required.' });
        }

        const response = await createSubscription(userId, planId);
        res.status(200).json({ message: 'Subscription created successfully.', response });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'An error occurred while creating the subscription.' });
    }
});

// **Get billing info for a user**
router.get('/billing-info', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const billingInfo = await getBillingInfo(userId);
        res.status(200).json({ billingInfo });
    } catch (error) {
        console.error('Error retrieving billing info:', error);
        res.status(500).json({ error: 'An error occurred while retrieving billing info.' });
    }
});

module.exports = router;
