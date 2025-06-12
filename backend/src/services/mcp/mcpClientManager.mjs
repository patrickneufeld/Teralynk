// ============================================================================
// ✅ FILE: /backend/src/services/mcp/mcpClientManager.mjs
// Manages MCP Client lifecycle, encryption, and execution per customer/server
// ============================================================================

import { getServerById } from './mcpServerRegistry.mjs';
import { validateMCPCommand } from '../../utils/mcp/validateMCPCommand.mjs';
import { encryptObject, decryptObject } from '../../utils/mcp/encryptSecrets.mjs';
import {
  MCP_COMMAND_TYPES,
  isValidMCPCommand,
  createMCPResponse
} from '../../utils/mcp/model-context-protocol.mjs';

// Internal MCPClient class (or adapter)
class MCPClient {
  constructor({ server, config = {} }) {
    this.server = server;
    this.config = config;
    this.connected = false;
  }

  async connect() {
    // Simulate connection logic
    this.connected = true;
  }

  async execute(commandPayload) {
    // Simulate execution logic
    return {
      executed: true,
      server: this.server,
      command: commandPayload.command || commandPayload.action,
      params: commandPayload.params || commandPayload.input,
      timestamp: new Date().toISOString()
    };
  }

  disconnect() {
    this.connected = false;
  }
}

// Maintain client cache per tenant
const activeClients = new Map(); // Map<customerId, Map<serverId, MCPClient>>

export async function getOrCreateMCPClient(customerId, serverId, config = {}) {
  if (!activeClients.has(customerId)) {
    activeClients.set(customerId, new Map());
  }

  const customerMap = activeClients.get(customerId);

  if (customerMap.has(serverId)) {
    return customerMap.get(serverId);
  }

  const serverMeta = getServerById(serverId);
  if (!serverMeta) {
    throw new Error(`Invalid MCP server ID: ${serverId}`);
  }

  const enrichedConfig = {
    ...config,
    tenantId: customerId,
    encryptedSecrets: encryptObject(config.secrets || {})
  };

  const client = new MCPClient({ server: serverId, config: enrichedConfig });

  try {
    await client.connect?.();
    customerMap.set(serverId, client);
    return client;
  } catch (err) {
    throw new Error(`❌ MCPClient connection failed for ${serverId}: ${err.message}`);
  }
}

export async function executeMCPCommand(customerId, serverId, commandPayload, config = {}) {
  const { valid, reason } = validateMCPCommand(commandPayload, config);
  if (!valid) {
    return createMCPResponse(serverId, false, `❌ Invalid command: ${reason}`);
  }

  if (!isValidMCPCommand(commandPayload)) {
    return createMCPResponse(serverId, false, `❌ MCP command schema invalid`);
  }

  const client = await getOrCreateMCPClient(customerId, serverId, config);

  try {
    const result = await client.execute(commandPayload);
    return createMCPResponse(serverId, true, '✅ Command executed successfully', result);
  } catch (err) {
    return createMCPResponse(serverId, false, `❌ MCP execution failed: ${err.message}`);
  }
}

export function resetClient(customerId, serverId) {
  const customerMap = activeClients.get(customerId);
  if (customerMap && customerMap.has(serverId)) {
    const client = customerMap.get(serverId);
    client?.disconnect?.();
    customerMap.delete(serverId);
  }
}

export function listCustomerClients(customerId) {
  return activeClients.get(customerId) || new Map();
}

export function teardownCustomerClients(customerId) {
  const clientMap = activeClients.get(customerId);
  if (clientMap) {
    for (const client of clientMap.values()) {
      client?.disconnect?.();
    }
    activeClients.delete(customerId);
  }
}
