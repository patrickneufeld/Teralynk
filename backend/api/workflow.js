// File: /backend/api/workflow.js

const express = require('express');
const router = express.Router();
const { createWorkflow, listWorkflows, executeWorkflow } = require('../services/workflowService');

// Route to create a new workflow
router.post('/create', async (req, res) => {
    try {
        const { name, tasks } = req.body;

        if (!name || !tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Invalid workflow data provided.' });
        }

        const result = await createWorkflow(name, tasks);
        res.status(201).json({ message: 'Workflow created successfully.', workflow: result });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'An error occurred while creating the workflow.' });
    }
});

// Route to list all workflows
router.get('/list', async (req, res) => {
    try {
        const workflows = await listWorkflows();
        res.status(200).json({ workflows });
    } catch (error) {
        console.error('Error listing workflows:', error);
        res.status(500).json({ error: 'An error occurred while retrieving workflows.' });
    }
});

// Route to execute a workflow
router.post('/execute', async (req, res) => {
    try {
        const { workflowId, input } = req.body;

        if (!workflowId || !input) {
            return res.status(400).json({ error: 'Workflow ID and input data are required.' });
        }

        const result = await executeWorkflow(workflowId, input);
        res.status(200).json({ message: 'Workflow executed successfully.', result });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({ error: 'An error occurred while executing the workflow.' });
    }
});

module.exports = router;
