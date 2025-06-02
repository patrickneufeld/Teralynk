// File: /backend/services/emailService.js

const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();

// **Set the SendGrid API Key**
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// **Send an email notification**
const sendEmail = async (to, subject, text, html = null, attachments = []) => {
    try {
        if (!to || !subject || !text) {
            throw new Error('Recipient, subject, and text content are required to send an email.');
        }

        const msg = {
            to, // Recipient email address
            from: process.env.SENDER_EMAIL, // Sender email address from environment variables
            subject, // Email subject
            text, // Plain text content
            html, // Optional: HTML content for richer emails
            attachments, // Optional: Attachments (if any)
        };

        await sgMail.send(msg);
        console.log(`Email sent successfully to ${to}`);
        return { success: true, message: `Email sent to ${to}` };
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw new Error('Failed to send email.');
    }
};

// **Send bulk emails**
const sendBulkEmails = async (recipients, subject, text, html = null) => {
    try {
        if (!Array.isArray(recipients) || recipients.length === 0) {
            throw new Error('Recipients must be a non-empty array.');
        }

        const messages = recipients.map((to) => ({
            to,
            from: process.env.SENDER_EMAIL,
            subject,
            text,
            html,
        }));

        await sgMail.send(messages);
        console.log(`Bulk emails sent successfully to ${recipients.length} recipients.`);
        return { success: true, message: `Emails sent to ${recipients.length} recipients.` };
    } catch (error) {
        console.error('Error sending bulk emails:', error.message);
        throw new Error('Failed to send bulk emails.');
    }
};

module.exports = {
    sendEmail,
    sendBulkEmails, // Export bulk email function
};
