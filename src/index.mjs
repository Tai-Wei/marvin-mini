#!/usr/bin/env node
if (process.stdin.isTTY) {
  console.error(`marvin-mini is an MCP stdio server, not an interactive CLI.

Start it from an MCP client instead:
  codex mcp add marvin-mini -- npx -y marvin-mini@latest

For JSON MCP client configs:
  "command": "npx",
  "args": ["-y", "marvin-mini@latest"]`);
  process.exit(0);
}

const [{ McpServer }, { StdioServerTransport }, { registerTools }] =
  await Promise.all([
    import("@modelcontextprotocol/sdk/server/mcp.js"),
    import("@modelcontextprotocol/sdk/server/stdio.js"),
    import("./tools.mjs"),
  ]);

const server = new McpServer({
  name: "marvin-mini",
  version: "0.1.4",
});

registerTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
