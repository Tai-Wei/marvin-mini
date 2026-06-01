# marvin-mini

marvin-mini is a small MCP server that exposes X/Twitter search tools backed by the local Grok Build CLI.

It does not call the xAI API directly. Instead, each MCP tool call spawns a stateless `grok -p` headless process and relies on the local Grok CLI login.

## Repository

- GitHub: <https://github.com/Tai-Wei/marvin-mini>
- Author: [Taiwei (@Tai-Wei)](https://github.com/Tai-Wei)
- English docs: [docs/en/README.md](docs/en/README.md)
- 中文文档: [docs/cn/README.md](docs/cn/README.md)

## Requirements

- Node.js >= 18.18.0
- Grok Build CLI installed
- Grok Build CLI logged in with `grok login`

Install dependencies:

```bash
npm install
```

## Tools

marvin-mini exposes four MCP tools:

- `x_keyword_search`: search X/Twitter posts by keyword
- `x_semantic_search`: search X/Twitter posts by meaning or intent
- `x_user_search`: find an X/Twitter user profile and recent posts
- `x_thread_fetch`: fetch a full X/Twitter thread

Each marvin-mini tool allows Grok to use only the corresponding built-in Grok X tool.

## Usage

Run the MCP server over stdio:

```bash
node /absolute/path/to/marvin-mini/src/index.mjs
```

If the MCP client starts marvin-mini from a non-login shell and cannot find `grok`, set `MARVIN_GROK_BIN` to the absolute Grok binary path:

```bash
MARVIN_GROK_BIN=/absolute/path/to/grok node /absolute/path/to/marvin-mini/src/index.mjs
```

The MCP server process must also have access to the same Grok login state. If a GUI client or service runs with a different `HOME`, `grok` may behave as if it is not logged in.

## Client Configuration

### Codex CLI

```bash
codex mcp add marvin-mini -- node /absolute/path/to/marvin-mini/src/index.mjs
```

With an explicit Grok binary:

```bash
codex mcp add marvin-mini --env MARVIN_GROK_BIN=/absolute/path/to/grok -- node /absolute/path/to/marvin-mini/src/index.mjs
```

### Claude Code

Add to `~/.claude/settings.json` or project `.claude/settings.json`:

```json
{
  "mcpServers": {
    "marvin-mini": {
      "command": "node",
      "args": ["/absolute/path/to/marvin-mini/src/index.mjs"],
      "env": {
        "MARVIN_GROK_BIN": "/absolute/path/to/grok"
      }
    }
  }
}
```

The `env` block is optional when `grok` is already on `PATH`.

### Gemini CLI / Cursor

Use the same stdio MCP shape:

```json
{
  "mcpServers": {
    "marvin-mini": {
      "command": "node",
      "args": ["/absolute/path/to/marvin-mini/src/index.mjs"],
      "env": {
        "MARVIN_GROK_BIN": "/absolute/path/to/grok"
      }
    }
  }
}
```

## Development

```bash
npm run check
npm test
```

`npm test` uses fake local Grok executables for wrapper tests, so it does not require live X/Twitter searches.
