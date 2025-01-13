const Contact = require('../models/Contact');

const submitContactForm = async (req, res) => {
    const { name, email, message } = req.body;
    try {
        await Contact.create({ name, email, message });
        res.status(200).json({ message: 'Contact form submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting contact form', error: err });
    }
};

module.exports = { submitContactForm };
