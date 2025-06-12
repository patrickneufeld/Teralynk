// File: /backend/services/paymentService.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { recordActivity } = require('./activityLogService'); // Log payment activities
const { query } = require('./db'); // For database operations
const dotenv = require('dotenv');

dotenv.config();

// **Create a payment session**
const createPaymentSession = async (userId, amount, currency, successUrl, cancelUrl) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: await getUserEmail(userId), // Optional: Automatically associate with a customer email
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: 'Subscription',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        // Log the creation of the payment session
        await recordActivity(userId, 'createPaymentSession', null, { sessionId: session.id, amount, currency });

        console.log(`Payment session created for user ${userId}:`, session.id);
        return session;
    } catch (error) {
        console.error('Error creating payment session:', error);
        throw new Error('Failed to create payment session.');
    }
};

// **Handle webhook events from Stripe**
const handleWebhookEvent = async (event) => {
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                // Log successful payment
                await recordActivity(null, 'paymentSuccess', null, { session });

                // Save payment info to database
                await savePaymentDetails(session);

                console.log('Payment successful:', session.id);
                break;

            case 'payment_intent.payment_failed':
                const paymentIntent = event.data.object;

                // Log failed payment
                await recordActivity(null, 'paymentFailed', null, { paymentIntent });

                console.log('Payment failed:', paymentIntent.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error handling webhook event:', error);
        return { success: false, error: error.message };
    }
};

// **Save payment details to the database**
const savePaymentDetails = async (session) => {
    try {
        await query(
            `INSERT INTO payments (payment_id, user_email, amount, currency, status, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                session.payment_intent,
                session.customer_email,
                session.amount_total,
                session.currency,
                session.payment_status,
                new Date(),
            ]
        );

        console.log(`Payment details saved for session: ${session.id}`);
    } catch (error) {
        console.error('Error saving payment details:', error);
        throw new Error('Failed to save payment details.');
    }
};

// **Retrieve payment history for a user**
const getPaymentHistory = async (userId) => {
    try {
        const userEmail = await getUserEmail(userId);

        const result = await query(
            `SELECT * FROM payments WHERE user_email = $1 ORDER BY created_at DESC`,
            [userEmail]
        );

        console.log(`Payment history retrieved for user ${userId}`);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving payment history:', error);
        throw new Error('Failed to retrieve payment history.');
    }
};

// **Refund a payment**
const refundPayment = async (paymentId) => {
    try {
        const refund = await stripe.refunds.create({ payment_intent: paymentId });

        // Log refund activity
        await recordActivity(null, 'refundPayment', null, { paymentId, refundId: refund.id });

        console.log(`Payment refunded: ${paymentId}`);
        return refund;
    } catch (error) {
        console.error('Error processing refund:', error);
        throw new Error('Failed to process refund.');
    }
};

// **Helper to retrieve user email (replace with actual user lookup logic)**
const getUserEmail = async (userId) => {
    try {
        const result = await query('SELECT email FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new Error(`User not found: ${userId}`);
        }
        return result.rows[0].email;
    } catch (error) {
        console.error('Error retrieving user email:', error);
        throw new Error('Failed to retrieve user email.');
    }
};

module.exports = {
    createPaymentSession,
    handleWebhookEvent,
    savePaymentDetails,
    getPaymentHistory,
    refundPayment,
};
