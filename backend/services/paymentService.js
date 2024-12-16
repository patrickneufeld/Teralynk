const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment session
const createPaymentSession = async (amount, currency, successUrl, cancelUrl) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
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

    return session;
};

module.exports = { createPaymentSession };
