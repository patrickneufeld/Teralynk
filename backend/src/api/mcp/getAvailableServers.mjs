// =======================================================================
// ✅ FILE: /backend/src/api/mcp/getAvailableServers.mjs
// Returns list of available MCP servers (from the registry) to frontend
// =======================================================================

import { getAvailableMCPServers } from '../../services/mcp/mcpServerRegistry.mjs';

export default async function getAvailableServers(req, res) {
  try {
    const servers = getAvailableMCPServers();
    res.status(200).json({ servers });
  } catch (err) {
    console.error('[MCP:getAvailableServers] Error:', err);
    res.status(500).json({ error: 'Failed to fetch MCP server list' });
  }
}
