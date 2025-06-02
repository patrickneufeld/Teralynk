// ==============================================
// ✅ FILE: /backend/src/services/mcp/mcpServerRegistry.mjs
// MCP Server Registry: Central catalog of available MCP servers
// ==============================================

export const MCP_SERVER_REGISTRY = [
  {
    id: 'shell',
    name: 'Shell Executor',
    description: 'Execute safe terminal commands via whitelisted input',
    configSchema: {
      allowedCommands: { type: 'array', items: { type: 'string' } }
    },
    isDangerous: true,
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    description: 'Query and update Notion databases or pages',
    configSchema: {
      notionToken: { type: 'string' },
      workspaceId: { type: 'string' },
    },
  },
  {
    id: 'minecraft',
    name: 'Minecraft Bot',
    description: 'Control a Minecraft character via AI',
    configSchema: {
      username: { type: 'string' }
    },
  },
  {
    id: 'openai',
    name: 'OpenAI Integration',
    description: 'Call OpenAI APIs from workflows',
    configSchema: {
      apiKey: { type: 'string' },
    },
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Upload and manage files in Google Drive',
    configSchema: {
      accessToken: { type: 'string' }
    },
  },
  {
    id: 'aws',
    name: 'AWS SDK Access',
    description: 'Perform AWS SDK actions securely',
    configSchema: {
      accessKeyId: { type: 'string' },
      secretAccessKey: { type: 'string' },
      region: { type: 'string' },
    },
  },
  {
    id: 'searx',
    name: 'SearXNG Search',
    description: 'Privacy-preserving web search via SearX',
    configSchema: {},
  }
];

export function getAvailableMCPServers() {
  return MCP_SERVER_REGISTRY;
}

export function getServerById(serverId) {
  return MCP_SERVER_REGISTRY.find(s => s.id === serverId);
}
