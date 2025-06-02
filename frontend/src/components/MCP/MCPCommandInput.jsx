// ============================================================================
// ✅ FILE: /frontend/src/components/MCP/MCPCommandInput.jsx
// Provides inputs for serverId, action, and command input for testing
// ============================================================================

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function MCPCommandInput({
  serverId,
  action,
  input,
  onChange,
  onRun,
}) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Server ID (e.g., shell, notion)"
        value={serverId}
        onChange={(e) => onChange('serverId', e.target.value)}
      />
      <Input
        placeholder="Action (e.g., run, query)"
        value={action}
        onChange={(e) => onChange('action', e.target.value)}
      />
      <Input
        placeholder="Input (string or JSON)"
        value={input}
        onChange={(e) => onChange('input', e.target.value)}
      />
      <Button onClick={onRun}>Execute</Button>
    </div>
  );
}
