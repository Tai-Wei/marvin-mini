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
npm install -g marvin-mini@latest
```

## MCP Tools

marvin-mini exposes 5 MCP tools:

- `x_keyword_search`: search X/Twitter posts by keyword, including visible post text, date, author, and link
- `x_semantic_search`: search X/Twitter posts by semantic meaning or natural language intent, including visible post text, date, author, and link
- `x_user_search`: search X/Twitter user profiles and recent posts, including visible post text and links when available
- `x_user_posts_search`: search posts from one X/Twitter user over a date range
- `x_thread_fetch`: fetch thread context for an X/Twitter post, including visible post text, dates, authors, links, and replies

Each MCP tool allows Grok to use only the corresponding built-in X tool, reducing prompt drift.

`x_thread_fetch` accepts optional depth controls:

```json
{
  "post_url": "https://x.com/user/status/123",
  "mode": "summary | balanced | deep",
  "max_posts": 50,
  "timeout_seconds": 300
}
```

For very long or high-engagement threads, start with `summary` or `balanced`, then run parallel `x_thread_fetch` calls on selected reply or quote URLs.

## Parallel Search Strategy

marvin-mini stays stateless and does not create agents internally. For broad searches, let the calling CLI split work across multiple agents or parallel tool calls.

Recommended patterns:

- Date sharding: for a three-day search, run one `x_user_posts_search` or `x_keyword_search` call per day, then merge, dedupe, and sort by time.
- Tool sharding: run `x_user_search`, `x_keyword_search`, and `x_semantic_search` in parallel, then compare results.
- Thread sharding: first fetch `summary` or `balanced` context, then fetch important reply or quote URLs in parallel.

Example three-day user search:

```text
Agent A: x_user_posts_search(username="elonmusk", from_date="2026-05-30", to_date="2026-05-31")
Agent B: x_user_posts_search(username="elonmusk", from_date="2026-05-31", to_date="2026-06-01")
Agent C: x_user_posts_search(username="elonmusk", from_date="2026-06-01", to_date="2026-06-02")
Main agent: merge, dedupe, sort, summarize, and keep source links
```

## Client Configuration

### Codex CLI

```bash
codex mcp add marvin-mini -- npx -y marvin-mini@latest
```

If the client cannot find `grok`, explicitly set the Grok CLI path:

```bash
codex mcp add marvin-mini --env MARVIN_GROK_BIN=/absolute/path/to/grok -- npx -y marvin-mini@latest
```

If Codex reports an MCP startup timeout, use the globally installed command to avoid going through `npx` on every startup:

```bash
npm install -g marvin-mini@latest
command -v marvin-mini
codex mcp remove marvin-mini
codex mcp add marvin-mini -- /absolute/path/from/command-v
```

If you still want a larger cold-start window, set this in `~/.codex/config.toml`:

```toml
[mcp_servers.marvin-mini]
startup_timeout_sec = 60
```

For long thread or multi-day searches, also increase the tool-call timeout:

```toml
[mcp_servers.marvin-mini]
tool_timeout_sec = 300
```

If you also need to set the Grok CLI path explicitly:

```bash
codex mcp add marvin-mini --env MARVIN_GROK_BIN=/absolute/path/to/grok -- /absolute/path/from/command-v
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
