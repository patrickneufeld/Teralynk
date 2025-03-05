import Joi from "joi";

// Validation for starting a session
const validateSessionStart = (req, res, next) => {
    const schema = Joi.object({
        fileId: Joi.string().required(),
        participants: Joi.array().items(Joi.string()).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

// Validation for ending a session
const validateSessionEnd = (req, res, next) => {
    const schema = Joi.object({
        id: Joi.string().required(),
    });

    const { error } = schema.validate(req.params);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

module.exports = { validateSessionStart, validateSessionEnd };
