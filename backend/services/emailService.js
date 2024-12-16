const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send an email notification
const sendEmail = async (to, subject, text) => {
    const msg = {
        to,
        from: process.env.SENDER_EMAIL,
        subject,
        text,
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
};

module.exports = { sendEmail };
