// File Path: backend/services/workflowService.js

const { query } = require('./db');

/**
 * Get all workflows
 * @returns {Promise<Array>} - List of all workflows.
 */
const getAllWorkflows = async () => {
    try {
        const result = await query('SELECT * FROM workflows');
        return result.rows;
    } catch (error) {
        console.error('Error fetching workflows:', error.stack);
        throw new Error('Failed to fetch workflows');
    }
};

/**
 * Create a new workflow
 * @param {object} workflowData - Data for the new workflow.
 * @returns {Promise<object>} - Created workflow data.
 */
const createWorkflow = async (workflowData) => {
    const { name, description, steps } = workflowData;

    try {
        const result = await query(
            'INSERT INTO workflows (name, description, steps) VALUES ($1, $2, $3) RETURNING *',
            [name, description, steps]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating workflow:', error.stack);
        throw new Error('Failed to create workflow');
    }
};

/**
 * Get a specific workflow by ID
 * @param {string} workflowId - The ID of the workflow.
 * @returns {Promise<object>} - The workflow data.
 */
const getWorkflowById = async (workflowId) => {
    try {
        const result = await query('SELECT * FROM workflows WHERE id = $1', [workflowId]);
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found.`);
        }
        return result.rows[0];
    } catch (error) {
        console.error(`Error fetching workflow with ID ${workflowId}:`, error.stack);
        throw new Error('Failed to fetch workflow');
    }
};

// Export the functions
module.exports = {
    getAllWorkflows,
    createWorkflow,
    getWorkflowById,
};
