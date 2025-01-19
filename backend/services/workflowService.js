// File: backend/services/workflowService.js

const { query } = require('./db'); // Ensure your DB query function is imported here

/**
 * Get all workflows
 * @returns {Promise<Array>} - List of all workflows.
 */
const getAllWorkflows = async () => {
    try {
        const result = await query('SELECT * FROM workflows'); // Query to fetch workflows from the database
        return result.rows; // Return the list of workflows
    } catch (error) {
        console.error('Error fetching workflows:', error.stack); // Log the error stack for debugging
        throw new Error('Failed to fetch workflows'); // Throw an error if something goes wrong
    }
};

/**
 * Create a new workflow
 * @param {object} workflowData - Data for the new workflow.
 * @returns {Promise<object>} - Created workflow data.
 */
const createWorkflow = async (workflowData) => {
    const { name, description, steps } = workflowData; // Destructure the incoming data for clarity

    try {
        const result = await query(
            'INSERT INTO workflows (name, description, steps) VALUES ($1, $2, $3) RETURNING *', 
            [name, description, steps] // Insert the workflow data into the DB
        );
        return result.rows[0]; // Return the created workflow
    } catch (error) {
        console.error('Error creating workflow:', error.stack); // Log the error stack for debugging
        throw new Error('Failed to create workflow'); // Throw an error if something goes wrong
    }
};

/**
 * Get a specific workflow by ID
 * @param {string} workflowId - The ID of the workflow.
 * @returns {Promise<object>} - The workflow data.
 */
const getWorkflowById = async (workflowId) => {
    try {
        const result = await query('SELECT * FROM workflows WHERE id = $1', [workflowId]); // Query to fetch a single workflow by ID
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found.`); // If no workflow is found, throw an error
        }
        return result.rows[0]; // Return the workflow data
    } catch (error) {
        console.error(`Error fetching workflow with ID ${workflowId}:`, error.stack); // Log the error stack for debugging
        throw new Error('Failed to fetch workflow'); // Throw an error if something goes wrong
    }
};

module.exports = {
    getAllWorkflows,
    createWorkflow,
    getWorkflowById,
};
