# marvin-mini English Guide

marvin-mini is a lightweight MCP server that provides X/Twitter search capability to other MCP clients through the locally logged-in Grok Build CLI.

It does not call the xAI API directly. Each MCP tool call starts an independent `grok -p` headless process and uses Grok CLI's built-in X search tools to complete the query.

## Project Information

- GitHub: <https://github.com/Tai-Wei/marvin-mini>
- Author: [Taiwei (@Tai-Wei)](https://github.com/Tai-Wei)
- License: Apache-2.0

## Use Cases

marvin-mini is suitable for MCP clients that only need X/Twitter search capability, such as:

- Claude Code
- Codex CLI
- Gemini CLI
- Cursor
- Cline

If you later need broader Grok capabilities such as review, rescue, or swarm, the recommended path is to create a full `marvin` project and reuse or reference this project as the X search module.

## Requirements

- Node.js >= 18.18.0
- Grok Build CLI installed
- `grok login` completed

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

## MCP Tools

marvin-mini exposes 4 MCP tools:

- `x_keyword_search`: search X/Twitter posts by keyword, including visible post text, date, author, and link
- `x_semantic_search`: search X/Twitter posts by semantic meaning or natural language intent, including visible post text, date, author, and link
- `x_user_search`: search X/Twitter user profiles and recent posts, including visible post text and links when available
- `x_thread_fetch`: fetch a full thread for an X/Twitter post, including visible post text, dates, authors, links, and replies

Each MCP tool allows Grok to use only the corresponding built-in X tool, reducing prompt drift.

## Client Configuration

### Codex CLI

```bash
codex mcp add marvin-mini -- npx -y marvin-mini@latest
```

If the client cannot find `grok`, explicitly set the Grok CLI path:

```bash
codex mcp add marvin-mini --env MARVIN_GROK_BIN=/absolute/path/to/grok -- npx -y marvin-mini@latest
```

### Claude Code

Add this to `~/.claude/settings.json` or project `.claude/settings.json`:

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

If `grok` is already in the MCP server process `PATH`, the `env` block can be omitted.

After npm publication, MCP clients that support command arguments can use this shape:

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

## Notes

GUI clients or system services may start the MCP server with a different `PATH` or `HOME`. Even if the `grok` path is correct, Grok CLI may behave as if it is not logged in when `HOME` is not the user directory where `grok login` was run.

## More Documentation

For full design and implementation details, see [DOC.md](DOC.md).
