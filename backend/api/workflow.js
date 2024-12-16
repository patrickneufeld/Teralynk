// File: /backend/api/workflow.js

const express = require('express');
const router = express.Router();
const {
    createWorkflow,
    listWorkflows,
    executeWorkflow,
    getWorkflowDetails,
    updateWorkflow,
    deleteWorkflow
} = require('../services/workflowService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Route to create a new workflow**
router.post('/create', rbacMiddleware('admin'), validateRequestBody(['name', 'tasks']), async (req, res) => {
    try {
        const { name, tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Tasks must be an array.' });
        }

        const result = await createWorkflow(name, tasks);
        res.status(201).json({ message: 'Workflow created successfully.', workflow: result });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'An error occurred while creating the workflow.', details: error.message });
    }
});

// **2️⃣ Route to list all workflows**
router.get('/list', rbacMiddleware('user'), async (req, res) => {
    try {
        const workflows = await listWorkflows();
        res.status(200).json({ message: 'Workflows retrieved successfully.', workflows });
    } catch (error) {
        console.error('Error listing workflows:', error);
        res.status(500).json({ error: 'An error occurred while retrieving workflows.', details: error.message });
    }
});

// **3️⃣ Route to get workflow details by ID**
router.get('/details/:workflowId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { workflowId } = req.params;

        if (!workflowId) {
            return res.status(400).json({ error: 'Workflow ID is required.' });
        }

        const workflow = await getWorkflowDetails(workflowId);
        res.status(200).json({ message: 'Workflow details retrieved successfully.', workflow });
    } catch (error) {
        console.error('Error retrieving workflow details:', error);
        res.status(500).json({ error: 'An error occurred while retrieving workflow details.', details: error.message });
    }
});

// **4️⃣ Route to update an existing workflow**
router.put('/update/:workflowId', rbacMiddleware('admin'), validateRequestBody(['name', 'tasks']), async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { name, tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Tasks must be an array.' });
        }

        const updatedWorkflow = await updateWorkflow(workflowId, name, tasks);
        res.status(200).json({ message: 'Workflow updated successfully.', workflow: updatedWorkflow });
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'An error occurred while updating the workflow.', details: error.message });
    }
});

// **5️⃣ Route to execute a workflow**
router.post('/execute', rbacMiddleware('user'), validateRequestBody(['workflowId', 'input']), async (req, res) => {
    try {
        const { workflowId, input } = req.body;

        const result = await executeWorkflow(workflowId, input);
        res.status(200).json({ message: 'Workflow executed successfully.', result });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({ error: 'An error occurred while executing the workflow.', details: error.message });
    }
});

// **6️⃣ Route to delete a workflow**
router.delete('/delete/:workflowId', rbacMiddleware('admin'), async (req, res) => {
    try {
        const { workflowId } = req.params;

        if (!workflowId) {
            return res.status(400).json({ error: 'Workflow ID is required.' });
        }

        const response = await deleteWorkflow(workflowId);
        res.status(200).json({ message: 'Workflow deleted successfully.', response });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ error: 'An error occurred while deleting the workflow.', details: error.message });
    }
});

module.exports = router;
