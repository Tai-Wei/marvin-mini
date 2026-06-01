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

## Installation

MCP clients can start the server with `npx`:

```bash
npx -y marvin-mini@latest
```

This command is meant to be launched by an MCP client. If you run it directly in a terminal, marvin-mini prints a short usage message and exits, because stdio MCP servers wait for JSON-RPC messages from a client.

Using `marvin-mini@latest` also avoids npm resolving a local source checkout named `marvin-mini` when your current directory is the project repository.

Or install it globally and configure your MCP client to run `marvin-mini`:

```bash
npm install -g marvin-mini
```

## Tools

marvin-mini exposes four MCP tools:

- `x_keyword_search`: search X/Twitter posts by keyword, including visible post text, date, author, and link
- `x_semantic_search`: search X/Twitter posts by meaning or intent, including visible post text, date, author, and link
- `x_user_search`: find an X/Twitter user profile and recent posts, including visible post text and links when available
- `x_thread_fetch`: fetch a full X/Twitter thread, including visible post text, dates, authors, links, and replies

Each marvin-mini tool allows Grok to use only the corresponding built-in Grok X tool.

## Usage

Run the MCP server over stdio:

```bash
npx -y marvin-mini@latest
```

If the MCP client starts marvin-mini from a non-login shell and cannot find `grok`, set `MARVIN_GROK_BIN` to the absolute Grok binary path:

```bash
MARVIN_GROK_BIN=/absolute/path/to/grok npx -y marvin-mini@latest
```

The MCP server process must also have access to the same Grok login state. If a GUI client or service runs with a different `HOME`, `grok` may behave as if it is not logged in.

## Client Configuration

### Codex CLI

```bash
codex mcp add marvin-mini -- npx -y marvin-mini@latest
```

With an explicit Grok binary:

```bash
codex mcp add marvin-mini --env MARVIN_GROK_BIN=/absolute/path/to/grok -- npx -y marvin-mini@latest
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

After npm publication, you can also use `npx` in MCP clients that support command arguments:

```json
{
  "mcpServers": {
    "marvin-mini": {
      "command": "npx",
      "args": ["-y", "marvin-mini@latest"],
      "env": {
        "MARVIN_GROK_BIN": "/absolute/path/to/grok"
      }
    }
  }
}
```

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
