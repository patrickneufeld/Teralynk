// ✅ FILE: /backend/src/api/webhooks.mjs

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { logSecurityEvent } = require('../src/logger/securityLogger');
const { generateTraceId } = require('../src/logger/traceUtil');

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('❌ STRIPE_WEBHOOK_SECRET is not defined in environment variables.');
}

// Middleware to verify Stripe webhook signature
const validateStripeSignature = (req, res, next) => {
  const traceId = generateTraceId();
  const sigHeader = req.headers['stripe-signature'];

  if (!sigHeader) {
    logSecurityEvent('webhook.stripe.signature.missing', { traceId });
    return res.status(400).json({ success: false, error: 'Missing Stripe signature header.' });
  }

  const payloadBuffer = req.body;
  const expectedSignature = crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(payloadBuffer)
    .digest('hex');

  const providedSignatures = sigHeader
    .split(',')
    .map(entry => entry.split('=')[1].trim());

  const isValid = providedSignatures.some(sig => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  });

  if (!isValid) {
    logSecurityEvent('webhook.stripe.signature.invalid', {
      traceId,
      expectedSignature,
      providedSignatures,
    });
    return res.status(400).json({ success: false, error: 'Invalid Stripe signature.' });
  }

  try {
    req.stripeEvent = JSON.parse(payloadBuffer.toString());
    req.traceId = traceId;
    next();
  } catch (err) {
    logSecurityEvent('webhook.stripe.payload.invalid', { traceId, error: err.message });
    return res.status(400).json({ success: false, error: 'Invalid Stripe payload.' });
  }
};

// Stripe Webhook Endpoint
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  validateStripeSignature,
  async (req, res) => {
    const traceId = req.traceId || generateTraceId();
    const event = req.stripeEvent;

    try {
      console.log(`📩 Stripe webhook received [${event.type}]`, { traceId });
      await handleStripeEvent(event, traceId);

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully.',
        traceId,
      });
    } catch (err) {
      console.error('❌ Webhook processing error:', err);
      logSecurityEvent('webhook.stripe.processing.failure', {
        traceId,
        error: err.message,
      });

      return res.status(500).json({
        success: false,
        error: 'Webhook handling failed.',
        traceId,
      });
    }
  }
);

// Modular handler for Stripe events
const handleStripeEvent = async (event, traceId) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('✅ Payment succeeded:', event.data.object);
      break;

    case 'invoice.payment_failed':
      console.log('⚠️ Payment failed:', event.data.object);
      break;

    case 'customer.subscription.created':
      console.log('📦 Subscription created:', event.data.object);
      break;

    case 'customer.subscription.deleted':
      console.log('❌ Subscription canceled:', event.data.object);
      break;

    case 'charge.refunded':
      console.log('💸 Charge refunded:', event.data.object);
      break;

    default:
      console.log(`📬 Unhandled Stripe event type: ${event.type}`, { traceId });
      break;
  }
};

// Fallback route for unsupported webhook routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Invalid webhook endpoint.',
  });
});

module.exports = router;
