// File: backend/api/docs.js

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json'); // Correct path to the swagger.json file

const router = express.Router();

// Serve Swagger UI at /docs endpoint
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
