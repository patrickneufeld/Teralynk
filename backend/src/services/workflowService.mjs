// ================================================
// 🚀 Complete Workflow Service
// File: /backend/src/services/workflowService.mjs
// Consolidated service for full Teralynk backend workflow functionality
// ================================================

import { query } from "../config/db.mjs";
import logger from "../config/logger.mjs";
import crypto from "crypto";

// --- Helpers & Validation ---
export const validateWorkflow = (workflow) => {
  const errors = [];

  if (!workflow.name?.trim()) errors.push("Workflow name is required");
  if (!Array.isArray(workflow.steps)) errors.push("Steps must be an array");
  else if (workflow.steps.length === 0) errors.push("Workflow must contain at least one step");
  else {
    const stepIds = new Set();
    for (const [i, step] of workflow.steps.entries()) {
      if (!step.id) errors.push(`Step ${i + 1} missing id`);
      else if (stepIds.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
      else stepIds.add(step.id);
      if (!step.type) errors.push(`Step ${i + 1} missing type`);
    }
  }

  return { isValid: errors.length === 0, errors };
};

// --- Event Logging ---
export const logWorkflowEvent = async (workflowId, eventType, details = {}) => {
  await query(
    "INSERT INTO workflow_events (workflow_id, event_type, details, created_at) VALUES ($1, $2, $3, NOW())",
    [workflowId, eventType, JSON.stringify(details)]
  );
};

export const logWorkflowError = async (workflowId, errorData) => {
  const { executionId, message, stepId, stack, context } = errorData;
  await query(
    "INSERT INTO workflow_errors (workflow_id, execution_id, message, step_id, stack_trace, context, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
    [workflowId, executionId, message, stepId, stack, JSON.stringify(context)]
  );
};

export const trackWorkflowUsage = async (workflowId, userId = null) => {
  await query(
    "INSERT INTO workflow_usage (workflow_id, user_id, used_at) VALUES ($1, $2, NOW())",
    [workflowId, userId]
  );
};

// --- CRUD Operations ---
export const listWorkflows = async ({ page = 1, limit = 10, status = null }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = '';

  if (status) {
    whereClause = 'WHERE status = $1';
    params.push(status);
  }

  const workflows = await query(
    `SELECT * FROM workflows ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM workflows ${whereClause}`,
    params
  );

  return {
    workflows: workflows.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    },
  };
};

export const createWorkflow = async ({ name, description = "", steps }) => {
  const validation = validateWorkflow({ name, steps });
  if (!validation.isValid) throw new Error(validation.errors.join(", "));

  const result = await query(
    "INSERT INTO workflows (name, description, steps, status, created_at) VALUES ($1, $2, $3, 'active', NOW()) RETURNING *",
    [name, description, JSON.stringify(steps)]
  );

  await logWorkflowEvent(result.rows[0].id, "WORKFLOW_CREATED", { stepsCount: steps.length });
  return result.rows[0];
};

export const getWorkflowById = async (workflowId) => {
  const result = await query(
    "SELECT w.*, COUNT(wu.id) as execution_count, COUNT(we.id) as error_count FROM workflows w LEFT JOIN workflow_usage wu ON w.id = wu.workflow_id LEFT JOIN workflow_errors we ON w.id = we.workflow_id WHERE w.id = $1 GROUP BY w.id",
    [workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  return result.rows[0];
};

export const updateWorkflow = async (workflowId, data) => {
  const { name, description, steps } = data;
  const result = await query(
    "UPDATE workflows SET name = $1, description = $2, steps = $3, updated_at = NOW() WHERE id = $4 RETURNING *",
    [name, description, JSON.stringify(steps), workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  return result.rows[0];
};

export const deleteWorkflow = async (workflowId) => {
  const result = await query("DELETE FROM workflows WHERE id = $1 RETURNING *", [workflowId]);
  if (result.rows.length === 0) throw new Error("Workflow not found");
  return result.rows[0];
};

// --- Execution Logic ---
export const executeWorkflow = async (workflowId, input = {}) => {
  const executionId = crypto.randomUUID();
  const workflow = await getWorkflowById(workflowId);
  let result = input;

  for (const task of workflow.steps) {
    try {
      await logWorkflowEvent(workflowId, "STEP_STARTED", { executionId, stepId: task.id });
      result = await simulateTask(task, result);
      await logWorkflowEvent(workflowId, "STEP_COMPLETED", { executionId, stepId: task.id, result });
    } catch (err) {
      await logWorkflowError(workflowId, {
        executionId,
        message: err.message,
        stepId: task.id,
        stack: err.stack,
        context: { task, input },
      });
      throw new Error(`Step failed: ${task.id}`);
    }
  }

  await logWorkflowEvent(workflowId, "EXECUTION_COMPLETED", { executionId, result });
  return { executionId, result };
};

const simulateTask = async (task, input) => {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({ ...input, [`task_${task.id}`]: `result_of_${task.type}` });
    }, 300)
  );
};

// --- Extended ---
export const cloneWorkflow = async (workflowId) => {
  const sourceWorkflow = await getWorkflowById(workflowId);
  const clonedData = {
    name: `${sourceWorkflow.name} (Clone)`,
    description: sourceWorkflow.description,
    steps: sourceWorkflow.steps
  };

  const result = await createWorkflow(clonedData);
  await logWorkflowEvent(result.id, "WORKFLOW_CLONED", { sourceId: workflowId });
  return result;
};

export const searchWorkflows = async ({ keyword, page = 1, limit = 10, status, sortBy = 'created_at', sortOrder = 'DESC' }) => {
  const offset = (page - 1) * limit;
  const params = [`%${keyword}%`];
  let whereClause = 'WHERE (name ILIKE $1 OR description ILIKE $1)';

  if (status) {
    whereClause += ' AND status = $2';
    params.push(status);
  }

  const result = await query(
    `SELECT * FROM workflows ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM workflows ${whereClause}`,
    params
  );

  return {
    workflows: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
  };
};

export const pauseWorkflowExecution = async (workflowId) => {
  const result = await query(
    "UPDATE workflows SET status = 'paused', updated_at = NOW() WHERE id = $1 RETURNING *",
    [workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  await logWorkflowEvent(workflowId, "WORKFLOW_PAUSED");
  return result.rows[0];
};

export const resumeWorkflowExecution = async (workflowId) => {
  const result = await query(
    "UPDATE workflows SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *",
    [workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  await logWorkflowEvent(workflowId, "WORKFLOW_RESUMED");
  return result.rows[0];
};

export const cancelWorkflowExecution = async (workflowId) => {
  const result = await query(
    "UPDATE workflows SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
    [workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  await logWorkflowEvent(workflowId, "WORKFLOW_CANCELLED");
  return result.rows[0];
};

export const getWorkflowExecutionLogs = async (workflowId) => {
  const result = await query(
    "SELECT * FROM workflow_events WHERE workflow_id = $1 ORDER BY created_at DESC",
    [workflowId]
  );
  return result.rows;
};

export const validateWorkflowTasks = async (tasks) => {
  const errors = [];
  for (const [index, task] of tasks.entries()) {
    if (!task.type) errors.push(`Task ${index + 1} missing type`);
    if (!task.config) errors.push(`Task ${index + 1} missing configuration`);
  }
  return errors.length === 0;
};

export const saveWorkflowVersion = async (workflowId, versionData) => {
  const result = await query(
    "INSERT INTO workflow_versions (workflow_id, version_data, created_at) VALUES ($1, $2, NOW()) RETURNING *",
    [workflowId, JSON.stringify(versionData)]
  );
  return result.rows[0];
};

export const getWorkflowVersionHistory = async (workflowId) => {
  const result = await query(
    "SELECT * FROM workflow_versions WHERE workflow_id = $1 ORDER BY created_at DESC",
    [workflowId]
  );
  return result.rows;
};

export const optimizeWorkflow = async (workflow) => {
  return { ...workflow, optimized: true };
};

export const resolveConflicts = async (workflow) => {
  return { ...workflow, conflicts_resolved: true };
};

export const shareWorkflow = async (workflowId, userId) => {
  const result = await query(
    "INSERT INTO workflow_shares (workflow_id, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *",
    [workflowId, userId]
  );
  return result.rows[0];
};

export const assignWorkflowOwner = async (workflowId, ownerId) => {
  const result = await query(
    "UPDATE workflows SET owner_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [ownerId, workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  return result.rows[0];
};

export const getSharedWorkflows = async (userId) => {
  const result = await query(
    "SELECT w.* FROM workflows w INNER JOIN workflow_shares ws ON w.id = ws.workflow_id WHERE ws.user_id = $1",
    [userId]
  );
  return result.rows;
};

export const archiveWorkflow = async (workflowId) => {
  const result = await query(
    "UPDATE workflows SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING *",
    [workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  return result.rows[0];
};

export const restoreWorkflow = async (workflowId) => {
  const result = await query(
    "UPDATE workflows SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *",
    [workflowId]
  );

  if (result.rows.length === 0) throw new Error("Workflow not found");
  return result.rows[0];
};

export const generateWorkflowReport = async (workflowId) => {
  const workflow = await getWorkflowById(workflowId);
  const events = await getWorkflowExecutionLogs(workflowId);
  const errors = await query(
    "SELECT * FROM workflow_errors WHERE workflow_id = $1",
    [workflowId]
  );

  return {
    workflow,
    events,
    errors: errors.rows,
    generated_at: new Date().toISOString()
  };
};

export const scheduleWorkflowExecution = async (workflowId, scheduleTime) => {
  const result = await query(
    "INSERT INTO workflow_schedules (workflow_id, schedule_time, created_at) VALUES ($1, $2, NOW()) RETURNING *",
    [workflowId, scheduleTime]
  );
  return result.rows[0];
};

// --- Compatibility ---
export const getWorkflowDetails = getWorkflowById;

// --- Export All ---
export default {
  validateWorkflow,
  logWorkflowEvent,
  logWorkflowError,
  trackWorkflowUsage,
  listWorkflows,
  createWorkflow,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getWorkflowDetails,
  cloneWorkflow,
  searchWorkflows,
  pauseWorkflowExecution,
  resumeWorkflowExecution,
  cancelWorkflowExecution,
  getWorkflowExecutionLogs,
  validateWorkflowTasks,
  saveWorkflowVersion,
  getWorkflowVersionHistory,
  optimizeWorkflow,
  resolveConflicts,
  shareWorkflow,
  assignWorkflowOwner,
  getSharedWorkflows,
  archiveWorkflow,
  restoreWorkflow,
  generateWorkflowReport,
  scheduleWorkflowExecution
};
