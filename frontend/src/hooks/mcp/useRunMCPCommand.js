// ======================================================================
// ✅ FILE: /frontend/src/hooks/mcp/useRunMCPCommand.js
// Sends a test command to the backend MCP router and returns result
// ======================================================================

export async function runMCPCommand({ customerId, serverId, action, input }) {
  try {
    const res = await fetch('/api/mcp/runMCPCommand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, serverId, action, input }),
    });

    if (!res.ok) throw new Error('Command failed');
    const { result } = await res.json();
    return result;
  } catch (err) {
    console.error('[useRunMCPCommand] Error:', err);
    return { error: err.message };
  }
}
