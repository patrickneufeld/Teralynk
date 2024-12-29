const { v4: uuidv4 } = require('uuid'); // For generating unique workflow IDs

// Temporary in-memory store for workflows (Replace with database for production)
const workflows = [];

// **1️⃣ Create a new workflow**
const createWorkflow = async (name, tasks) => {
    if (!Array.isArray(tasks)) {
        throw { status: 400, message: 'Tasks must be an array.' };
    }

    tasks.forEach((task, index) => {
        if (!task.id || !task.type || typeof task.params !== 'object') {
            throw { status: 400, message: `Invalid task structure at index ${index}.` };
        }
    });

    const workflow = {
        id: uuidv4(), // Generate a unique workflow ID
        name,
        tasks,
        createdAt: new Date(),
        updatedAt: new Date(),
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
    const workflow = workflows.find((wf) => wf.id === workflowId);
    if (!workflow) {
        throw { status: 404, message: 'Workflow not found.' };
    }
    return workflow;
};

// **4️⃣ Update an existing workflow**
const updateWorkflow = async (workflowId, name, tasks) => {
    const workflow = workflows.find((wf) => wf.id === workflowId);
    if (!workflow) {
        throw { status: 404, message: 'Workflow not found.' };
    }

    if (tasks) {
        if (!Array.isArray(tasks)) {
            throw { status: 400, message: 'Tasks must be an array.' };
        }

        tasks.forEach((task, index) => {
            if (!task.id || !task.type || typeof task.params !== 'object') {
                throw { status: 400, message: `Invalid task structure at index ${index}.` };
            }
        });

        workflow.tasks = tasks;
    }

    workflow.name = name || workflow.name;
    workflow.updatedAt = new Date();

    return workflow;
};

// **5️⃣ Execute a workflow**
const executeWorkflow = async (workflowId, input) => {
    const workflow = await getWorkflowDetails(workflowId);

    let result = input;
    for (const task of workflow.tasks) {
        try {
            result = await executeTask(task, result);
        } catch (error) {
            console.error(`Error executing task "${task.id}":`, error);
            throw { status: 500, message: `Task "${task.id}" failed: ${error.message}` };
        }
    }

    return result;
};

// **Helper function to execute a task**
const executeTask = async (task, input) => {
    switch (task.type) {
        case 'email':
            // Simulate email sending logic
            console.log(`Sending email with params:`, task.params);
            break;
        case 'dataProcessing':
            // Simulate data processing logic
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

// **6️⃣ Delete a specific workflow by ID**
const deleteWorkflow = async (workflowId) => {
    const index = workflows.findIndex((wf) => wf.id === workflowId);
    if (index === -1) {
        throw { status: 404, message: 'Workflow not found.' };
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
    deleteWorkflow,
};
