
// ======================================================================
// ✅ FILE: /frontend/src/hooks/mcp/useMCPConfig.js
// Saves per-customer config for a selected MCP server
// ======================================================================

export async function saveMCPConfig(customerId, serverId, config) {
  try {
    const res = await fetch('/api/mcp/saveCustomerConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, serverId, config }),
    });

    if (!res.ok) throw new Error('Failed to save config');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[useMCPConfig] Error saving config for ${serverId}:`, err);
    return null;
  }
}
