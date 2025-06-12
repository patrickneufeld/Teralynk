// ============================================================================
// ✅ FILE: /frontend/src/pages/MCP/ConfigureMCPApps.jsx
// UI for enabling/disabling MCP apps and configuring per-server credentials
// ============================================================================

import React, { useEffect, useState } from 'react';
import { getAvailableServers, saveMCPConfig } from '@/hooks/mcp/useMCPConfig';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ConfigureMCPApps() {
  const [servers, setServers] = useState([]);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(false);
  const customerId = 'demo-user'; // Replace with actual user context

  useEffect(() => {
    (async () => {
      const available = await getAvailableServers();
      setServers(available || []);
    })();
  }, []);

  const handleInputChange = (serverId, key, value) => {
    setConfigs(prev => ({
      ...prev,
      [serverId]: {
        ...(prev[serverId] || {}),
        [key]: value,
      },
    }));
  };

  const handleSave = async (serverId) => {
    setLoading(true);
    await saveMCPConfig(customerId, serverId, configs[serverId]);
    setLoading(false);
    alert(`${serverId} config saved`);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Configure MCP Applications</h1>
      {servers.map((server) => (
        <Card key={server.id}>
          <CardContent className="space-y-2 p-4">
            <h2 className="font-bold">{server.name}</h2>
            <p className="text-sm text-gray-500">{server.description}</p>
            {Object.entries(server.configSchema || {}).map(([key, schema]) => (
              <Input
                key={key}
                type="text"
                placeholder={key}
                value={configs[server.id]?.[key] || ''}
                onChange={(e) =>
                  handleInputChange(server.id, key, e.target.value)
                }
              />
            ))}
            <Button onClick={() => handleSave(server.id)} disabled={loading}>
              Save {server.name}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
