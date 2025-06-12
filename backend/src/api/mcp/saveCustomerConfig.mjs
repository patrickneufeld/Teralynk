// ===================================================================================
// ✅ FILE: /backend/src/api/mcp/saveCustomerConfig.mjs
// Stores or updates a customer’s MCP server config securely in the database
// ===================================================================================

import { saveMCPConfig } from '../../models/mcpConfigModel.mjs';
import { getServerById } from '../../services/mcp/mcpServerRegistry.mjs';

export default async function saveCustomerConfig(req, res) {
  try {
    const { customerId, serverId, config } = req.body;

    if (!customerId || !serverId || typeof config !== 'object') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const server = getServerById(serverId);
    if (!server) {
      return res.status(404).json({ error: `Unknown MCP server: ${serverId}` });
    }

    const saved = await saveMCPConfig(customerId, serverId, config);
    res.status(200).json({ success: true, config: saved });
  } catch (err) {
    console.error('[MCP:saveCustomerConfig] Error:', err);
    res.status(500).json({ error: 'Failed to save MCP config' });
  }
}
