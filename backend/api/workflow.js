const express = require('express');
const router = express.Router();
const {
    createWorkflow,
    listWorkflows,
    executeWorkflow,
    getWorkflowDetails,
    updateWorkflow,
    deleteWorkflow,
    cloneWorkflow,
    searchWorkflows,
    pauseWorkflowExecution,
    resumeWorkflowExecution,
    cancelWorkflowExecution,
    getWorkflowExecutionLogs,
    validateWorkflowTasks,
    saveWorkflowVersion,
    getWorkflowVersionHistory
} = require('../services/workflowService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Create a new workflow**
router.post('/create', rbacMiddleware('admin'), validateRequestBody(['name', 'tasks']), async (req, res) => {
    try {
        const { name, tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ success: false, error: 'Tasks must be an array.' });
        }

        const result = await createWorkflow(name, tasks);
        res.status(201).json({
            success: true,
            message: 'Workflow created successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while creating the workflow.',
            details: error.message,
        });
    }
});

// **2️⃣ List all workflows**
router.get('/list', rbacMiddleware('user'), async (req, res) => {
    try {
        const workflows = await listWorkflows();
        res.status(200).json({
            success: true,
            message: 'Workflows retrieved successfully.',
            data: workflows,
        });
    } catch (error) {
        console.error('Error listing workflows:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving workflows.',
            details: error.message,
        });
    }
});

// **3️⃣ Get workflow details by ID**
router.get('/details/:workflowId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { workflowId } = req.params;

        if (!workflowId) {
            return res.status(400).json({
                success: false,
                error: 'Workflow ID is required.',
            });
        }

        const workflow = await getWorkflowDetails(workflowId);
        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Workflow details retrieved successfully.',
            data: workflow,
        });
    } catch (error) {
        console.error('Error retrieving workflow details:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving workflow details.',
            details: error.message,
        });
    }
});

// **4️⃣ Update an existing workflow**
router.put('/update/:workflowId', rbacMiddleware('admin'), validateRequestBody(['name', 'tasks']), async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { name, tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ success: false, error: 'Tasks must be an array.' });
        }

        const updatedWorkflow = await updateWorkflow(workflowId, name, tasks);
        res.status(200).json({
            success: true,
            message: 'Workflow updated successfully.',
            data: updatedWorkflow,
        });
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating the workflow.',
            details: error.message,
        });
    }
});

// **5️⃣ Execute a workflow**
router.post('/execute', rbacMiddleware('user'), validateRequestBody(['workflowId', 'input']), async (req, res) => {
    try {
        const { workflowId, input } = req.body;

        const result = await executeWorkflow(workflowId, input);
        res.status(200).json({
            success: true,
            message: 'Workflow executed successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while executing the workflow.',
            details: error.message,
        });
    }
});

// **6️⃣ Delete a workflow**
router.delete('/delete/:workflowId', rbacMiddleware('admin'), async (req, res) => {
    try {
        const { workflowId } = req.params;

        if (!workflowId) {
            return res.status(400).json({
                success: false,
                error: 'Workflow ID is required.',
            });
        }

        const response = await deleteWorkflow(workflowId);
        res.status(200).json({
            success: true,
            message: 'Workflow deleted successfully.',
            data: response,
        });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while deleting the workflow.',
            details: error.message,
        });
    }
});

// **7️⃣ Clone a workflow**
router.post('/clone', rbacMiddleware('admin'), validateRequestBody(['workflowId', 'newName']), async (req, res) => {
    try {
        const { workflowId, newName } = req.body;
        const clonedWorkflow = await cloneWorkflow(workflowId, newName);
        res.status(201).json({
            success: true,
            message: 'Workflow cloned successfully.',
            data: clonedWorkflow,
        });
    } catch (error) {
        console.error('Error cloning workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while cloning the workflow.',
            details: error.message,
        });
    }
});

// **8️⃣ Search workflows**
router.get('/search', rbacMiddleware('user'), async (req, res) => {
    try {
        const { name, taskType, createdBefore, createdAfter } = req.query;
        const criteria = { name, taskType, createdBefore, createdAfter };
        const workflows = await searchWorkflows(criteria);
        res.status(200).json({
            success: true,
            message: 'Workflows retrieved successfully.',
            data: workflows,
        });
    } catch (error) {
        console.error('Error searching workflows:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while searching for workflows.',
            details: error.message,
        });
    }
});

// **9️⃣ Pause a workflow**
router.post('/pause', rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res) => {
    try {
        const { workflowId } = req.body;
        const result = await pauseWorkflowExecution(workflowId);
        res.status(200).json({
            success: true,
            message: 'Workflow execution paused successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error pausing workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while pausing the workflow execution.',
            details: error.message,
        });
    }
});

// **🔟 Resume a workflow**
router.post('/resume', rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res) => {
    try {
        const { workflowId } = req.body;
        const result = await resumeWorkflowExecution(workflowId);
        res.status(200).json({
            success: true,
            message: 'Workflow execution resumed successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error resuming workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while resuming the workflow execution.',
            details: error.message,
        });
    }
});

// **🔟 Cancel a workflow**
router.post('/cancel', rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res) => {
    try {
        const { workflowId } = req.body;
        const result = await cancelWorkflowExecution(workflowId);
        res.status(200).json({
            success: true,
            message: 'Workflow execution cancelled successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error cancelling workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while cancelling the workflow execution.',
            details: error.message,
        });
    }
});

// **🔟 Workflow Execution Logs**
router.get('/logs/:workflowId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { workflowId } = req.params;
        const logs = await getWorkflowExecutionLogs(workflowId);
        res.status(200).json({
            success: true,
            message: 'Workflow execution logs retrieved successfully.',
            data: logs,
        });
    } catch (error) {
        console.error('Error retrieving workflow logs:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving workflow logs.',
            details: error.message,
        });
    }
});

// **🔟 Validate Workflow Tasks**
router.post('/validate', rbacMiddleware('admin'), validateRequestBody(['tasks']), async (req, res) => {
    try {
        const { tasks } = req.body;
        const validationResults = await validateWorkflowTasks(tasks);
        res.status(200).json({
            success: true,
            message: 'Workflow tasks validated successfully.',
            data: validationResults,
        });
    } catch (error) {
        console.error('Error validating workflow tasks:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while validating workflow tasks.',
            details: error.message,
        });
    }
});

// **🔟 Save Workflow Version**
router.post('/version', rbacMiddleware('admin'), validateRequestBody(['workflowId', 'changes']), async (req, res) => {
    try {
        const { workflowId, changes } = req.body;
        const version = await saveWorkflowVersion(workflowId, changes);
        res.status(201).json({
            success: true,
            message: 'Workflow version saved successfully.',
            data: version,
        });
    } catch (error) {
        console.error('Error saving workflow version:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while saving the workflow version.',
            details: error.message,
        });
    }
});

// **🔟 Get Workflow Version History**
router.get('/version-history/:workflowId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { workflowId } = req.params;
        const history = await getWorkflowVersionHistory(workflowId);
        res.status(200).json({
            success: true,
            message: 'Workflow version history retrieved successfully.',
            data: history,
        });
    } catch (error) {
        console.error('Error retrieving workflow version history:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving workflow version history.',
            details: error.message,
        });
    }
});

module.exports = router;
