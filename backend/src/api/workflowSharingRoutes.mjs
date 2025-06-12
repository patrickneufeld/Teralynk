// File Path: backend/src/api/workflowSharingRoutes.mjs

const express = require('express');
const router = express.Router();
const { shareWorkflow, getSharedWorkflows, updatePermissions } = require('../services/workflowSharingService');

// **Share a workflow**
router.post('/share', async (req, res) => {
    try {
        const { workflowId, userIds } = req.body;
        const response = await shareWorkflow(workflowId, userIds);
        res.status(200).json({ success: true, message: 'Workflow shared successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while sharing the workflow.' });
    }
});

// **Get shared workflows for a user**
router.get('/shared', async (req, res) => {
    try {
        const { userId } = req.query;
        const workflows = await getSharedWorkflows(userId);
        res.status(200).json({ success: true, message: 'Shared workflows retrieved successfully', data: workflows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while retrieving shared workflows.' });
    }
});

// **Update permissions on shared workflow**
router.put('/permissions', async (req, res) => {
    try {
        const { workflowId, userId, permission } = req.body;
        const response = await updatePermissions(workflowId, userId, permission);
        res.status(200).json({ success: true, message: 'Permissions updated successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while updating permissions.' });
    }
});

module.exports = router;
