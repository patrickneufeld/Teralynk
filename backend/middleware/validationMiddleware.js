const Joi = require('joi');

const validationMiddleware = (schema) => (req, res, next) => {
    try {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: `Validation Error: ${error.message}` });
        }
        next();
    } catch (error) {
        console.error('Validation Error:', error);
        res.status(400).json({ error: 'Invalid request data.' });
    }
};

module.exports = validationMiddleware;
