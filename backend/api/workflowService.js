const { query } = require('./db'); // Assuming query function is implemented in db.js

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

/**
 * Update an existing workflow
 * @param {string} workflowId - The ID of the workflow to update.
 * @param {object} updatedData - The updated data.
 * @returns {Promise<object>} - The updated workflow data.
 */
const updateWorkflow = async (workflowId, updatedData) => {
    const { name, description, steps } = updatedData;

    try {
        const result = await query(
            'UPDATE workflows SET name = $1, description = $2, steps = $3 WHERE id = $4 RETURNING *',
            [name, description, steps, workflowId]
        );
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found.`);
        }
        return result.rows[0];
    } catch (error) {
        console.error(`Error updating workflow with ID ${workflowId}:`, error.stack);
        throw new Error('Failed to update workflow');
    }
};

/**
 * Delete a specific workflow by ID
 * @param {string} workflowId - The ID of the workflow to delete.
 * @returns {Promise<object>} - The deleted workflow data.
 */
const deleteWorkflow = async (workflowId) => {
    try {
        const result = await query('DELETE FROM workflows WHERE id = $1 RETURNING *', [workflowId]);
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found.`);
        }
        return result.rows[0];
    } catch (error) {
        console.error(`Error deleting workflow with ID ${workflowId}:`, error.stack);
        throw new Error('Failed to delete workflow');
    }
};

/**
 * Execute a workflow
 * @param {string} workflowId - The ID of the workflow to execute.
 * @param {object} input - The input data for the workflow.
 * @returns {Promise<object>} - The result of the workflow execution.
 */
const executeWorkflow = async (workflowId, input) => {
    const workflow = await getWorkflowById(workflowId);

    let result = input;
    for (const task of workflow.steps) {
        try {
            result = await executeTask(task, result);
        } catch (error) {
            console.error(`Error executing task "${task.id}":`, error);
            throw new Error(`Task "${task.id}" failed: ${error.message}`);
        }
    }

    return result;
};

/**
 * Helper function to execute a task in the workflow
 * @param {object} task - The task to execute.
 * @param {any} input - The input data for the task.
 * @returns {Promise<any>} - The result of the task execution.
 */
const executeTask = async (task, input) => {
    switch (task.type) {
        case 'email':
            console.log(`Sending email with params:`, task.params);
            break;
        case 'dataProcessing':
            console.log(`Processing data with params:`, task.params);
            break;
        default:
            throw new Error(`Unsupported task type: ${task.type}`);
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Task ${task.id} of type ${task.type} executed successfully.`);
            resolve(`${input} -> ${task.id}`);
        }, 500);
    });
};

module.exports = {
    getAllWorkflows,
    createWorkflow,
    getWorkflowById,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
};
