// ============================================================================
// ✅ FILE: /frontend/src/pages/MCP/TestMCPCommand.jsx
// Allows customer to test commands against configured MCP servers
// ============================================================================

import React, { useState } from 'react';
import { runMCPCommand } from '@/hooks/mcp/useRunMCPCommand';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function TestMCPCommand() {
  const [serverId, setServerId] = useState('');
  const [action, setAction] = useState('');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const customerId = 'demo-user'; // Replace with session-aware ID

  const handleRun = async () => {
    const res = await runMCPCommand({ customerId, serverId, action, input });
    setResult(res);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">MCP Command Tester</h1>
      <Input
        placeholder="Server ID (e.g., notion, shell)"
        value={serverId}
        onChange={(e) => setServerId(e.target.value)}
      />
      <Input
        placeholder="Action (e.g., query, run)"
        value={action}
        onChange={(e) => setAction(e.target.value)}
      />
      <Input
        placeholder="Input (text or JSON)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <Button onClick={handleRun}>Run Command</Button>
      {result && (
        <pre className="bg-gray-100 p-4 mt-4 rounded text-sm overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
