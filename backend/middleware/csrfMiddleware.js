const { body, validationResult } = require('express-validator');

app.post('/api/endpoint', [
    body('name').isString().notEmpty(),
    body('email').isEmail()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Continue with request
});
