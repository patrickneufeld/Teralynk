// File: backend/routes/workflowRoutes.js

const express = require('express');
const router = express.Router();
const listWorkflowsRouter = require('../api/listWorkflows'); // Import the route you just created

// Use the listWorkflows route
router.use('/workflows/list', listWorkflowsRouter);

module.exports = router;
