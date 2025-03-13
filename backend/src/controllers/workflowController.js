import { v4 as uuidv4 } from "uuid";  // For generating unique IDs
import pkg from 'pg';  // PostgreSQL Client for database interaction
const { Client } = pkg;  // Destructure Client from 'pg'
import dotenv from "dotenv";  // To load environment variables

dotenv.config();

// Initialize PostgreSQL Client
const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

dbClient.connect().catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
});

// CREATE WORKFLOW
export const createWorkflow = async (req, res) => {
    try {
        const { name, description, steps, createdBy } = req.body;

        if (!name || !description || !steps || !createdBy) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const query = `
            INSERT INTO workflows (id, name, description, steps, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), name, description, JSON.stringify(steps), createdBy]);

        res.json({ message: "Workflow created successfully", workflow: result.rows[0] });
    } catch (error) {
        console.error("❌ Workflow Creation Error:", error.message);
        res.status(500).json({ error: "Failed to create workflow" });
    }
};

// FETCH ALL WORKFLOWS
export const getAllWorkflows = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM workflows ORDER BY created_at DESC");
        res.json({ workflows: result.rows });
    } catch (error) {
        console.error("❌ Fetch Workflows Error:", error.message);
        res.status(500).json({ error: "Failed to fetch workflows" });
    }
};

// FETCH A SINGLE WORKFLOW BY ID
export const getWorkflowById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("SELECT * FROM workflows WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workflow not found" });
        }

        res.json({ workflow: result.rows[0] });
    } catch (error) {
        console.error("❌ Fetch Workflow Error:", error.message);
        res.status(500).json({ error: "Failed to fetch workflow" });
    }
};

// UPDATE WORKFLOW
export const updateWorkflow = async (req, res) => {
    const { id } = req.params;
    const { name, description, steps, updatedBy } = req.body;
    try {
        const query = `
            UPDATE workflows 
            SET name = $1, description = $2, steps = $3, updated_by = $4, updated_at = NOW()
            WHERE id = $5 
            RETURNING *;
        `;

        const result = await dbClient.query(query, [name, description, JSON.stringify(steps), updatedBy, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Workflow not found" });
        }

        res.json({ message: "Workflow updated successfully", workflow: result.rows[0] });
    } catch (error) {
        console.error("❌ Update Workflow Error:", error.message);
        res.status(500).json({ error: "Failed to update workflow" });
    }
};

// DELETE WORKFLOW
export const deleteWorkflow = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM workflows WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Workflow not found" });
        }

        res.json({ message: "Workflow deleted successfully", workflow: result.rows[0] });
    } catch (error) {
        console.error("❌ Delete Workflow Error:", error.message);
        res.status(500).json({ error: "Failed to delete workflow" });
    }
};

// EXECUTE WORKFLOW
export const executeWorkflow = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("SELECT * FROM workflows WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workflow not found" });
        }

        const workflow = result.rows[0];
        // Assuming a function executeSteps exists to handle workflow execution
        const executionResult = await executeSteps(workflow.steps);

        res.json({ message: "Workflow executed successfully", result: executionResult });
    } catch (error) {
        console.error("❌ Execute Workflow Error:", error.message);
        res.status(500).json({ error: "Failed to execute workflow" });
    }
};

// VALIDATE WORKFLOW
export const validateWorkflow = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("SELECT * FROM workflows WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Workflow not found" });
        }

        const workflow = result.rows[0];
        // Assuming a function validateSteps exists to handle workflow validation
        const validationResult = await validateSteps(workflow.steps);

        res.json({ message: "Workflow validated successfully", result: validationResult });
    } catch (error) {
        console.error("❌ Validate Workflow Error:", error.message);
        res.status(500).json({ error: "Failed to validate workflow" });
    }
};

// Assuming functions executeSteps and validateSteps exist for workflow operations
const executeSteps = async (steps) => {
    // Placeholder function for executing workflow steps
    return { stepsExecuted: steps.length };
};

const validateSteps = async (steps) => {
    // Placeholder function for validating workflow steps
    return { stepsValidated: steps.length };
};
