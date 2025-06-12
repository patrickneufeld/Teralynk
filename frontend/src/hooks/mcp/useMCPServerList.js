// ======================================================================
// ✅ FILE: /frontend/src/hooks/mcp/useMCPServerList.js
// Fetches the list of available MCP servers from the backend
// ======================================================================

export async function getAvailableServers() {
  try {
    const res = await fetch('/api/mcp/getAvailableServers');
    if (!res.ok) throw new Error('Failed to fetch MCP servers');
    const { servers } = await res.json();
    return servers;
  } catch (err) {
    console.error('[useMCPServerList] Error:', err);
    return [];
  }
}
