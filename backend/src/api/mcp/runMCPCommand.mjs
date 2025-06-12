// =====================================================================================
// ✅ FILE: /backend/src/api/mcp/runMCPCommand.mjs
// Executes a command against a configured MCP server for the authenticated customer
// =====================================================================================

import { getMCPConfig } from '../../models/mcpConfigModel.mjs';
import { getOrCreateMCPClient } from '../../services/mcp/mcpClientManager.mjs';
import { getServerById } from '../../services/mcp/mcpServerRegistry.mjs';

export default async function runMCPCommand(req, res) {
  try {
    const { customerId, serverId, action, input } = req.body;

    if (!customerId || !serverId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const server = getServerById(serverId);
    if (!server) {
      return res.status(404).json({ error: `Unknown MCP server: ${serverId}` });
    }

    const config = await getMCPConfig(customerId, serverId);
    if (!config) {
      return res.status(403).json({ error: `No MCP config set for ${serverId}` });
    }

    const client = await getOrCreateMCPClient(customerId, serverId, config);
    const result = await client.run(action, input);

    res.status(200).json({ result });
  } catch (err) {
    console.error(`[MCP:runMCPCommand] Error running ${req.body?.action}:`, err);
    res.status(500).json({ error: `Execution failed: ${err.message}` });
  }
}
