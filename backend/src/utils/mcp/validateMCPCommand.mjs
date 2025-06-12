// ============================================================================
// ✅ FILE: /backend/src/utils/mcp/validateMCPCommand.mjs
// Validates user input for MCP commands to ensure safety (esp. for shell)
// ============================================================================

import { getServerById } from '../../services/mcp/mcpServerRegistry.mjs';

export function validateMCPCommand({ serverId, action, input }, config) {
  const server = getServerById(serverId);
  if (!server) {
    return { valid: false, reason: `Unknown MCP server "${serverId}"` };
  }

  if (serverId === 'shell') {
    const allowed = config.allowedCommands || [];
    const [command] = input?.trim().split(/\s+/);
    if (!allowed.includes(command)) {
      return {
        valid: false,
        reason: `Command "${command}" is not allowed for this tenant`,
      };
    }
  }

  if (!action || typeof action !== 'string') {
    return { valid: false, reason: 'Missing or invalid action' };
  }

  if (typeof input !== 'string' && typeof input !== 'object') {
    return { valid: false, reason: 'Input must be string or JSON object' };
  }

  return { valid: true };
}
