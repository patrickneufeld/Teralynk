// ================================================
// ✅ Workflow Service - Part 2: Execution & Advanced Features
// File: /backend/src/services/workflowExecution.mjs
// ================================================

import { query } from "../config/db.mjs";
import logger from "../config/logger.mjs";
import crypto from "crypto";
import { logWorkflowEvent, getWorkflowById } from "./workflowCore.mjs";

/**
 * ✅ Workflow Execution
 */

export const executeWorkflow = async (workflowId, input = {}) => {
  if (!workflowId) throw new Error("Workflow ID is required");

  const executionId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const workflow = await getWorkflowById(workflowId);
    if (workflow.status === 'archived') {
      throw new Error("Cannot execute archived workflow");
    }

    let result = input;
    
    await logWorkflowEvent(workflowId, 'EXECUTION_STARTED', { 
      executionId, 
      input 
    });

    for (const [index, task] of workflow.steps.entries()) {
      try {
        await logWorkflowEvent(workflowId, 'STEP_STARTED', {
          executionId,
          stepId: task.id,
          stepNumber: index + 1
        });

        result = await executeTask(task, result);

        await logWorkflowEvent(workflowId, 'STEP_COMPLETED', {
          executionId,
          stepId: task.id,
          stepNumber: index + 1,
          result
        });
      } catch (error) {
        await logWorkflowError(workflowId, {
          executionId,
          message: error.message,
          stepId: task.id,
          stack: error.stack,
          context: { 
            input: result, 
            task,
            stepNumber: index + 1
          }
        });
        
        throw error;
      }
    }

    const executionTime = Date.now() - startTime;
    
    await Promise.all([
      logWorkflowEvent(workflowId, 'EXECUTION_COMPLETED', {
        executionId,
        result,
        executionTime
      }),
      trackWorkflowUsage(workflowId, executionTime),
      collectWorkflowMetrics(workflowId, {
        executionTime,
        stepCount: workflow.steps.length,
        status: 'completed'
      })
    ]);

    return {
      executionId,
      result,
      executionTime
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await Promise.all([
      logWorkflowEvent(workflowId, 'EXECUTION_FAILED', {
        executionId,
        error: error.message,
        executionTime
      }),
      collectWorkflowMetrics(workflowId, {
        executionTime,
        status: 'failed',
        error: error.message
      })
    ]);

    logger.error(`❌ Error executing workflow ${workflowId}:`, error);
    throw new Error(`Workflow execution failed: ${error.message}`);
  }
};

const executeTask = async (task, input) => {
  if (!task?.type || !task?.id) {
    throw new Error("Invalid task configuration");
  }

  return new Promise((resolve, reject) => {
    try {
      switch (task.type) {
        case "email":
          logger.info(`📧 Sending email with params:`, task.params);
          // Implement actual email sending logic here
          break;
          
        case "dataProcessing":
          logger.info(`🔄 Processing data with params:`, task.params);
          // Implement actual data processing logic here
          break;
          
        case "delay":
          logger.info(`⏳ Delaying for ${task.params?.duration || 1000}ms`);
          break;
          
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      const delay = task.type === "delay" ? 
        (task.params?.duration || 1000) : 
        500;

      setTimeout(() => {
        logger.info(`✅ Task ${task.id} executed successfully`);
        resolve({
          taskId: task.id,
          type: task.type,
          input,
          output: `${input} → ${task.id}`,
          executedAt: new Date().toISOString()
        });
      }, delay);
    } catch (error) {
      reject(new Error(`Task execution failed: ${error.message}`));
    }
  });
};

/**
 * ✅ Workflow Control
 */

export const pauseWorkflowExecution = async (workflowId) => {
  if (!workflowId) throw new Error("Workflow ID is required");

  try {
    const { rows } = await query(
      `UPDATE workflows 
       SET status = 'paused',
           updated_at = NOW()
       WHERE id = $1 AND status = 'active'
       RETURNING *`,
      [workflowId]
    );

    if (rows.length === 0) {
      throw new Error(`Cannot pause workflow ${workflowId}`);
    }

    await logWorkflowEvent(workflowId, 'WORKFLOW_PAUSED', {
      pausedAt: new Date().toISOString()
    });

    return rows[0];
  } catch (error) {
    logger.error(`❌ Failed to pause workflow ${workflowId}:`, error);
    throw new Error(`Failed to pause workflow: ${error.message}`);
  }
};

export const resumeWorkflowExecution = async (workflowId) => {
  if (!workflowId) throw new Error("Workflow ID is required");

  try {
    const { rows } = await query(
      `UPDATE workflows 
       SET status = 'active',
           updated_at = NOW()
       WHERE id = $1 AND status = 'paused'
       RETURNING *`,
      [workflowId]
    );

    if (rows.length === 0) {
      throw new Error(`Cannot resume workflow ${workflowId}`);
    }

    await logWorkflowEvent(workflowId, 'WORKFLOW_RESUMED', {
      resumedAt: new Date().toISOString()
    });

    return rows[0];
  } catch (error) {
    logger.error(`❌ Failed to resume workflow ${workflowId}:`, error);
    throw new Error(`Failed to resume workflow: ${error.message}`);
  }
};

export const cancelWorkflowExecution = async (workflowId) => {
  if (!workflowId) throw new Error("Workflow ID is required");

  try {
    const { rows } = await query(
      `UPDATE workflows 
       SET status = 'canceled',
           updated_at = NOW()
       WHERE id = $1 AND status IN ('active', 'paused')
       RETURNING *`,
      [workflowId]
    );

    if (rows.length === 0) {
      throw new Error(`Cannot cancel workflow ${workflowId}`);
    }

    await logWorkflowEvent(workflowId, 'WORKFLOW_CANCELED', {
      canceledAt: new Date().toISOString()
    });

    return rows[0];
  } catch (error) {
    logger.error(`❌ Failed to cancel workflow ${workflowId}:`, error);
    throw new Error(`Failed to cancel workflow: ${error.message}`);
  }
};

/**
 * ✅ Monitoring & Metrics
 */

export const logWorkflowError = async (workflowId, errorData) => {
  try {
    const {
      executionId,
      message,
      stepId,
      stack,
      context
    } = errorData;

    await query(
      `INSERT INTO workflow_errors (
         workflow_id,
         execution_id,
         message,
         step_id,
         stack_trace,
         context,
         created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [workflowId, executionId, message, stepId, stack, JSON.stringify(context)]
    );

    logger.error(`⚠️ Workflow error logged:`, {
      workflowId,
      executionId,
      stepId,
      message
    });
  } catch (error) {
    logger.error(`❌ Failed to log workflow error:`, error);
    // Don't throw - logging shouldn't break the main flow
  }
};

export const trackWorkflowUsage = async (workflowId, executionTime) => {
  try {
    await query(
      `INSERT INTO workflow_usage (
         workflow_id,
         execution_time,
         created_at
       ) VALUES ($1, $2, NOW())`,
      [workflowId, executionTime]
    );
  } catch (error) {
    logger.error(`❌ Failed to track workflow usage:`, error);
    // Don't throw - tracking shouldn't break the main flow
  }
};

export const collectWorkflowMetrics = async (workflowId, metrics) => {
  try {
    await query(
      `INSERT INTO workflow_metrics (
         workflow_id,
         execution_time,
         step_count,
         status,
         error,
         created_at
       ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        workflowId,
        metrics.executionTime,
        metrics.stepCount,
        metrics.status,
        metrics.error || null
      ]
    );
  } catch (error) {
    logger.error(`❌ Failed to collect workflow metrics:`, error);
    // Don't throw - metrics collection shouldn't break the main flow
  }
};

export const getWorkflowMetrics = async (workflowId, timeRange = '24h') => {
  try {
    const { rows } = await query(
      `SELECT 
         COUNT(*) as total_executions,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_executions,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_executions,
         AVG(execution_time) as avg_execution_time,
         MAX(execution_time) as max_execution_time,
         MIN(execution_time) as min_execution_time
       FROM workflow_metrics
       WHERE workflow_id = $1
       AND created_at >= NOW() - $2::interval`,
      [workflowId, timeRange]
    );

    return rows[0];
  } catch (error) {
    logger.error(`❌ Failed to get workflow metrics:`, error);
    throw new Error(`Failed to get workflow metrics: ${error.message}`);
  }
};

/**
 * ✅ Optimization & Conflict Resolution
 */

export const optimizeWorkflow = async (workflow) => {
  if (!workflow || typeof workflow !== 'object' || !Array.isArray(workflow.steps)) {
    throw new Error("Invalid workflow object.");
  }

  try {
    const optimizedSteps = [...workflow.steps];

    // Remove duplicate tasks based on type and params
    const seen = new Set();
    for (let i = optimizedSteps.length - 1; i >= 0; i--) {
      const signature = `${optimizedSteps[i].type}:${JSON.stringify(optimizedSteps[i].params)}`;
      if (seen.has(signature)) {
        optimizedSteps.splice(i, 1);
      } else {
        seen.add(signature);
      }
    }

    const suggestions = [];
    if (optimizedSteps.length > 10) {
      suggestions.push("Consider breaking large workflows into smaller modules.");
    }

    return {
      optimizedSteps,
      originalStepCount: workflow.steps.length,
      optimizedStepCount: optimizedSteps.length,
      suggestions,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("❌ Failed to optimize workflow:", error);
    throw new Error("Workflow optimization failed.");
  }
};

export const resolveConflicts = async (workflow) => {
  if (!workflow || typeof workflow !== 'object' || !Array.isArray(workflow.steps)) {
    throw new Error("Invalid workflow object.");
  }

  try {
    const resolvedSteps = [];
    const seenIds = new Set();
    const duplicates = [];
    let circularDetected = false;

    for (const step of workflow.steps) {
      if (seenIds.has(step.id)) {
        duplicates.push(step.id);
        continue;
      }
      seenIds.add(step.id);
      resolvedSteps.push(step);
    }

    const allTargets = new Set(resolvedSteps.flatMap(step => step.next || []));
    for (const step of resolvedSteps) {
      if (allTargets.has(step.id)) {
        circularDetected = true;
        break;
      }
    }

    return {
      resolvedSteps,
      removedDuplicates: duplicates,
      circularDetected,
      valid: !circularDetected,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("❌ Conflict resolution failed:", error);
    throw new Error("Workflow conflict resolution failed.");
  }
};

export default {
  executeWorkflow,
  pauseWorkflowExecution,
  resumeWorkflowExecution,
  cancelWorkflowExecution,
  logWorkflowError,
  trackWorkflowUsage,
  collectWorkflowMetrics,
  getWorkflowMetrics,
  optimizeWorkflow,
  resolveConflicts,
  logWorkflowEvent,
  getWorkflowDetails,
  getWorkflowStats
};
