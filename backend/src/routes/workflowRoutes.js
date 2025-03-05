// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/workflowRoutes.js

import express from "express";
const { authenticate } = require("../middleware/authMiddleware");
import aiWorkflowManager from "../ai/aiWorkflowManager";
import aiLearningManager from "../ai/aiLearningManager";

const router = express.Router();

/**
 * Route: POST /api/workflows/create
 * Description: AI creates and configures a new automated workflow.
 */
router.post("/create", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { workflowName, triggers, actions } = req.body;

  if (!workflowName || !triggers || !actions) {
    return res.status(400).json({ error: "Workflow name, triggers, and actions are required." });
  }

  try {
    console.log(`⚙️ AI Creating Workflow: ${workflowName}`);

    // AI configures the workflow based on user input
    const workflowConfig = await aiWorkflowManager.createWorkflow(userId, workflowName, triggers, actions);
    
    // Log AI learning from workflow creation
    await aiLearningManager.logAILearning(userId, "workflow_created", { workflowName, triggers, actions });

    res.status(200).json({ message: "Workflow created successfully", workflowConfig });
  } catch (error) {
    console.error("Error creating workflow:", error.message);
    res.status(500).json({ error: "Failed to create workflow." });
  }
});

/**
 * Route: GET /api/workflows/list
 * Description: Retrieve a list of user-defined workflows.
 */
router.get("/list", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📋 AI Fetching Workflows for User: ${userId}`);

    // AI retrieves all active workflows for the user
    const workflows = await aiWorkflowManager.getUserWorkflows(userId);

    res.status(200).json({ message: "Workflows retrieved", workflows });
  } catch (error) {
    console.error("Error retrieving workflows:", error.message);
    res.status(500).json({ error: "Failed to retrieve workflows." });
  }
});

/**
 * Route: POST /api/workflows/execute
 * Description: AI executes an automated workflow based on triggers.
 */
router.post("/execute", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { workflowId, inputData } = req.body;

  if (!workflowId) {
    return res.status(400).json({ error: "Workflow ID is required." });
  }

  try {
    console.log(`🚀 AI Executing Workflow: ${workflowId}`);

    // AI triggers the workflow and executes associated actions
    const executionResult = await aiWorkflowManager.executeWorkflow(userId, workflowId, inputData);
    
    // Log AI learning from workflow execution
    await aiLearningManager.logAILearning(userId, "workflow_executed", { workflowId, inputData, executionResult });

    res.status(200).json({ message: "Workflow executed successfully", executionResult });
  } catch (error) {
    console.error("Error executing workflow:", error.message);
    res.status(500).json({ error: "Failed to execute workflow." });
  }
});

/**
 * Route: DELETE /api/workflows/delete
 * Description: AI deletes an existing workflow.
 */
router.delete("/delete", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { workflowId } = req.body;

  if (!workflowId) {
    return res.status(400).json({ error: "Workflow ID is required." });
  }

  try {
    console.log(`🗑️ AI Deleting Workflow: ${workflowId}`);

    // AI removes the workflow from the system
    const deleteResult = await aiWorkflowManager.deleteWorkflow(userId, workflowId);
    
    // Log AI learning from workflow removal
    await aiLearningManager.logAILearning(userId, "workflow_deleted", { workflowId });

    res.status(200).json({ message: "Workflow deleted successfully", deleteResult });
  } catch (error) {
    console.error("Error deleting workflow:", error.message);
    res.status(500).json({ error: "Failed to delete workflow." });
  }
});

module.exports = router;
