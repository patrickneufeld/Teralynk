// ================================================
// ✅ FILE: /backend/src/utils/mcp/model-context-protocol.mjs
// Shared schema/contract utilities for MCP clients
// ================================================

/**
 * Define a standard schema for MCP commands
 * Note: supports both "command/params" and "action/input" formats
 */
export const MCP_COMMAND_SCHEMA = {
  serverId: 'string',
  command: 'string',      // optional alias for "action"
  params: 'object',       // optional alias for "input"
  action: 'string',
  input: ['object', 'string'],
  timeout: 'number',
};

/**
 * Known MCP command types
 */
export const MCP_COMMAND_TYPES = [
  'START_SERVER',
  'STOP_SERVER',
  'RESTART_SERVER',
  'UPDATE_CONFIG',
  'EXEC_COMMAND',
];

/**
 * Validates if an MCP payload matches either schema variant
 * @param {object} payload
 * @returns {boolean}
 */
export function isValidMCPCommand(payload) {
  if (!payload || typeof payload !== 'object') return false;

  const hasAction = typeof payload.action === 'string';
  const hasCommand = typeof payload.command === 'string';
  const hasServerId = typeof payload.serverId === 'string';
  const hasParamsOrInput = typeof payload.params === 'object' || typeof payload.input === 'object' || typeof payload.input === 'string';
  const hasTimeout = typeof payload.timeout === 'undefined' || typeof payload.timeout === 'number';

  return hasServerId && (hasAction || hasCommand) && hasParamsOrInput && hasTimeout;
}

/**
 * Format a standardized MCP response object
 * @param {string} serverId
 * @param {boolean} success
 * @param {string} message
 * @param {object} [data]
 * @returns {object}
 */
export function createMCPResponse(serverId, success, message, data = {}) {
  return {
    serverId,
    status: success ? 'SUCCESS' : 'FAILURE',
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}
