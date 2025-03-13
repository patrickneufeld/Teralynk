// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/workflowRoutes.js

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import aiWorkflowManager from "../ai/aiWorkflowManager.js";
import aiLearningManager from "../ai/aiLearningManager.js";

const router = express.Router();

/**
 * Route: POST /api/workflows/create
 * Description: AI creates and configures a new automated workflow.
 */
router.post("/create", requireAuth, async (req, res) => {
  const { userId } = req.user;
  const { workflowName, triggers, actions } = req.body;

  if (!workflowName || !triggers || !actions) {
    return res.status(400).json({ error: "Workflow name, triggers, and actions are required." });
  }

  try {
    console.log(`⚙️ AI Creating Workflow: ${workflowName}`);

    const workflowConfig = await aiWorkflowManager.createWorkflow(userId, workflowName, triggers, actions);
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
router.get("/list", requireAuth, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📋 AI Fetching Workflows for User: ${userId}`);
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
router.post("/execute", requireAuth, async (req, res) => {
  const { userId } = req.user;
  const { workflowId, inputData } = req.body;

  if (!workflowId) {
    return res.status(400).json({ error: "Workflow ID is required." });
  }

  try {
    console.log(`🚀 AI Executing Workflow: ${workflowId}`);
    const executionResult = await aiWorkflowManager.executeWorkflow(userId, workflowId, inputData);
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
router.delete("/delete", requireAuth, async (req, res) => {
  const { userId } = req.user;
  const { workflowId } = req.body;

  if (!workflowId) {
    return res.status(400).json({ error: "Workflow ID is required." });
  }

  try {
    console.log(`🗑️ AI Deleting Workflow: ${workflowId}`);
    const deleteResult = await aiWorkflowManager.deleteWorkflow(userId, workflowId);
    await aiLearningManager.logAILearning(userId, "workflow_deleted", { workflowId });

    res.status(200).json({ message: "Workflow deleted successfully", deleteResult });
  } catch (error) {
    console.error("Error deleting workflow:", error.message);
    res.status(500).json({ error: "Failed to delete workflow." });
  }
});

export default router;
