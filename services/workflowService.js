// ✅ FILE: backend/services/workflowService.js

const { query } = require("./db"); // Ensure correct database connection import
const logger = require("../config/logger");

/**
 * Get all workflows
 * @returns {Promise<Array>} - List of all workflows.
 */
const getAllWorkflows = async () => {
    try {
        const result = await query("SELECT * FROM workflows");
        return result.rows;
    } catch (error) {
        logger.error("Error fetching workflows:", error);
        throw new Error("Failed to fetch workflows");
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
            "INSERT INTO workflows (name, description, steps) VALUES ($1, $2, $3) RETURNING *",
            [name, description, JSON.stringify(steps)]
        );
        return result.rows[0];
    } catch (error) {
        logger.error("Error creating workflow:", error.stack);
        throw new Error("Failed to create workflow");
    }
};

/**
 * Get a specific workflow by ID
 * @param {string} workflowId - The ID of the workflow.
 * @returns {Promise<object>} - The workflow data.
 */
const getWorkflowById = async (workflowId) => {
    try {
        const result = await query("SELECT * FROM workflows WHERE id = $1", [workflowId]);
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found.`);
        }
        return result.rows[0];
    } catch (error) {
        logger.error(`Error fetching workflow with ID ${workflowId}:`, error.stack);
        throw new Error("Failed to fetch workflow");
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
            "UPDATE workflows SET name = $1, description = $2, steps = $3 WHERE id = $4 RETURNING *",
            [name, description, JSON.stringify(steps), workflowId]
        );
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found.`);
        }
        return result.rows[0];
    } catch (error) {
        logger.error(`Error updating workflow with ID ${workflowId}:`, error.stack);
        throw new Error("Failed to update workflow");
    }
};

/**
 * Delete a specific workflow by ID
 * @param {string} workflowId - The ID of the workflow to delete.
 * @returns {Promise<object>} - The deleted workflow data.
 */
const deleteWorkflow = async (workflowId) => {
    try {
        const result = await query("DELETE FROM workflows WHERE id = $1 RETURNING *", [workflowId]);
        if (result.rows.length === 0) {
            throw new Error(`Workflow with ID ${workflowId} not found.`);
        }
        return result.rows[0];
    } catch (error) {
        logger.error(`Error deleting workflow with ID ${workflowId}:`, error.stack);
        throw new Error("Failed to delete workflow");
    }
};

/**
 * Execute a workflow
 * @param {string} workflowId - The ID of the workflow to execute.
 * @param {object} input - The input data for the workflow.
 * @returns {Promise<object>} - The result of the workflow execution.
 */
const executeWorkflow = async (workflowId, input) => {
    try {
        const workflow = await getWorkflowById(workflowId);

        let result = input;
        for (const task of workflow.steps) {
            try {
                result = await executeTask(task, result);
            } catch (error) {
                logger.error(`Error executing task "${task.id}":`, error);
                throw new Error(`Task "${task.id}" failed: ${error.message}`);
            }
        }

        return result;
    } catch (error) {
        logger.error(`Error executing workflow ${workflowId}:`, error.stack);
        throw new Error("Workflow execution failed");
    }
};

/**
 * Save a workflow version
 * @param {string} workflowId - The ID of the workflow.
 * @param {object} changes - The changes to save as a new version.
 * @returns {Promise<object>} - The saved workflow version.
 */
const saveWorkflowVersion = async (workflowId, changes) => {
    try {
        const result = await query(
            "INSERT INTO workflow_versions (workflow_id, changes, created_at) VALUES ($1, $2, NOW()) RETURNING *",
            [workflowId, JSON.stringify(changes)]
        );
        return result.rows[0];
    } catch (error) {
        logger.error("Error saving workflow version:", error.stack);
        throw new Error("Failed to save workflow version");
    }
};

/**
 * Get workflow version history
 * @param {string} workflowId - The ID of the workflow.
 * @returns {Promise<Array>} - The workflow version history.
 */
const getWorkflowVersionHistory = async (workflowId) => {
    try {
        const result = await query(
            "SELECT * FROM workflow_versions WHERE workflow_id = $1 ORDER BY created_at DESC",
            [workflowId]
        );
        return result.rows;
    } catch (error) {
        logger.error(`Error fetching version history for workflow ${workflowId}:`, error.stack);
        throw new Error("Failed to fetch workflow version history");
    }
};

/**
 * Helper function to execute a task in the workflow
 * @param {object} task - The task to execute.
 * @param {any} input - The input data for the task.
 * @returns {Promise<any>} - The result of the task execution.
 */
const executeTask = async (task, input) => {
    return new Promise((resolve, reject) => {
        try {
            switch (task.type) {
                case "email":
                    logger.info(`Sending email with params: ${JSON.stringify(task.params)}`);
                    break;
                case "dataProcessing":
                    logger.info(`Processing data with params: ${JSON.stringify(task.params)}`);
                    break;
                default:
                    throw new Error(`Unsupported task type: ${task.type}`);
            }

            setTimeout(() => {
                logger.info(`Task ${task.id} of type ${task.type} executed successfully.`);
                resolve(`${input} -> ${task.id}`);
            }, 500);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    getAllWorkflows,
    createWorkflow,
    getWorkflowById,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    saveWorkflowVersion,
    getWorkflowVersionHistory,
};
