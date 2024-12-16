// File: /backend/services/workflowService.js

const { v4: uuidv4 } = require('uuid'); // For generating unique workflow IDs

// Temporary in-memory store for workflows (Replace with database for production)
const workflows = [];

// **1️⃣ Create a new workflow**
const createWorkflow = async (name, tasks) => {
    if (!Array.isArray(tasks)) {
        throw new Error('Tasks must be an array.');
    }

    const workflow = {
        id: uuidv4(), // Generate a unique workflow ID
        name,
        tasks,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    workflows.push(workflow);
    return workflow;
};

// **2️⃣ List all workflows**
const listWorkflows = async () => {
    return workflows;
};

// **3️⃣ Get workflow details by ID**
const getWorkflowDetails = async (workflowId) => {
    const workflow = workflows.find(wf => wf.id === workflowId);
    if (!workflow) {
        throw new Error('Workflow not found.');
    }
    return workflow;
};

// **4️⃣ Update an existing workflow**
const updateWorkflow = async (workflowId, name, tasks) => {
    const workflow = workflows.find(wf => wf.id === workflowId);
    if (!workflow) {
        throw new Error('Workflow not found.');
    }

    workflow.name = name || workflow.name;
    workflow.tasks = Array.isArray(tasks) ? tasks : workflow.tasks;
    workflow.updatedAt = new Date();

    return workflow;
};

// **5️⃣ Execute a workflow**
const executeWorkflow = async (workflowId, input) => {
    const workflow = await getWorkflowDetails(workflowId);
    
    let result = input;
    for (const task of workflow.tasks) {
        try {
            // Placeholder for task execution logic
            console.log(`Executing task: ${task}`);
            result = await executeTask(task, result);
        } catch (error) {
            console.error(`Error executing task "${task}":`, error);
            throw new Error(`Task "${task}" failed: ${error.message}`);
        }
    }

    return result;
};

// Helper function to simulate task execution (this can be customized)
const executeTask = async (task, input) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Task ${task} executed successfully with input:`, input);
            resolve(`${input} -> ${task}`);
        }, 500);
    });
};

// **6️⃣ Delete a specific workflow by ID**
const deleteWorkflow = async (workflowId) => {
    const index = workflows.findIndex(wf => wf.id === workflowId);
    if (index === -1) {
        throw new Error('Workflow not found.');
    }

    const deletedWorkflow = workflows.splice(index, 1);
    return deletedWorkflow[0];
};

module.exports = {
    createWorkflow,
    listWorkflows,
    getWorkflowDetails,
    updateWorkflow,
    executeWorkflow,
    deleteWorkflow
};
