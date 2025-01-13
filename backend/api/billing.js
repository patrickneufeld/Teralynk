const express = require('express');
const router = express.Router();
const { createSubscription, getBillingInfo } = require('../services/billingService');
const rbacMiddleware = require('../middleware/rbacMiddleware'); // Role-based access control middleware

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Create a subscription for a user**
router.post('/create-subscription', validateRequestBody(['userId', 'planId']), async (req, res) => {
    try {
        const { userId, planId } = req.body;

        const response = await createSubscription(userId, planId);
        res.status(201).json({
            success: true,
            message: 'Subscription created successfully.',
            data: response,
        });
    } catch (error) {
        console.error('Error creating subscription:', error);

        if (error.code === 'SUBSCRIPTION_EXISTS') {
            return res.status(409).json({ success: false, error: 'A subscription already exists for this user.' });
        }

        res.status(500).json({ success: false, error: 'An error occurred while creating the subscription.' });
    }
});

// **2️⃣ Get billing info for a user**
router.get('/billing-info', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required.' });
        }

        const billingInfo = await getBillingInfo(userId);

        if (!billingInfo) {
            return res.status(404).json({ success: false, error: 'Billing information not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Billing information retrieved successfully.',
            data: billingInfo,
        });
    } catch (error) {
        console.error('Error retrieving billing info:', error);
        res.status(500).json({ success: false, error: 'An error occurred while retrieving billing info.' });
    }
});

module.exports = router;
