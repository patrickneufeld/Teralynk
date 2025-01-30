// File Path: backend/api/webhooks.js

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Stripe secret for signature verification
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Middleware to validate and verify Stripe webhook signature
const validateStripeSignature = (req, res, next) => {
    const sigHeader = req.headers['stripe-signature'];
    if (!sigHeader) {
        return res.status(400).json({ success: false, error: 'Missing Stripe signature header.' });
    }

    try {
        const payload = req.body;
        const computedSignature = crypto
            .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
            .update(payload, 'utf8')
            .digest('hex');

        // Stripe's signature includes multiple signatures; verify one matches
        const receivedSignatures = sigHeader.split(',').map((sig) => sig.split('=')[1]);
        if (!receivedSignatures.includes(computedSignature)) {
            return res.status(400).json({ success: false, error: 'Invalid Stripe signature.' });
        }

        req.stripeEvent = JSON.parse(payload); // Attach the event to the request
        next();
    } catch (error) {
        console.error('Error verifying Stripe signature:', error);
        return res.status(400).json({ success: false, error: 'Invalid Stripe signature.' });
    }
};

// **Handle Stripe webhooks**
router.post('/stripe', express.raw({ type: 'application/json' }), validateStripeSignature, async (req, res) => {
    try {
        const event = req.stripeEvent;

        console.log('Stripe webhook received:', event);

        // Event handling logic
        await handleStripeEvent(event);

        // Respond to Stripe to acknowledge receipt of the webhook
        res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
    } catch (error) {
        console.error('Error handling Stripe webhook:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing the webhook.',
        });
    }
});

// **Handle Stripe events (Modularized for scalability)**
const handleStripeEvent = async (event) => {
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object);
            // Add logic for handling successful payments
            break;

        case 'invoice.payment_failed':
            console.log('Payment failed:', event.data.object);
            // Add logic for handling failed payments
            break;

        case 'customer.subscription.created':
            console.log('Subscription created:', event.data.object);
            // Add logic for handling new subscriptions
            break;

        case 'customer.subscription.deleted':
            console.log('Subscription canceled:', event.data.object);
            // Add logic for handling subscription cancellations
            break;

        case 'charge.refunded':
            console.log('Charge refunded:', event.data.object);
            // Add logic for handling refunds
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
};

// **Fallback for unhandled routes (Optional)**
router.use((req, res) => {
    res.status(404).json({ success: false, error: 'Invalid webhook endpoint.' });
});

module.exports = router;
