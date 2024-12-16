// File: /backend/api/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({ error: err.message });
};

module.exports = errorHandler;
