// ============================================================================
// ✅ FILE: /frontend/src/components/MCP/MCPAppCard.jsx
// Renders a single MCP app card with configuration inputs and save button
// ============================================================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function MCPAppCard({
  server,
  config,
  onChange,
  onSave,
  loading = false,
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <h2 className="font-semibold text-lg">{server.name}</h2>
        <p className="text-sm text-gray-500">{server.description}</p>

        {Object.entries(server.configSchema || {}).map(([key]) => (
          <Input
            key={key}
            placeholder={key}
            type="text"
            value={config?.[key] || ''}
            onChange={(e) => onChange(server.id, key, e.target.value)}
          />
        ))}

        <Button
          className="mt-2"
          disabled={loading}
          onClick={() => onSave(server.id)}
        >
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
