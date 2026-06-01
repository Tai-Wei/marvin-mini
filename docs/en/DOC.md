# marvin-mini English Documentation

## Design Goal

marvin-mini aims to provide the smallest practical MCP server that lets MCP-capable clients search X/Twitter through the local Grok Build CLI.

The current version focuses only on X/Twitter search and does not include the full Grok capability set. This boundary is intentional: `marvin-mini` is the lightweight tool, while a future complete version can use the name `marvin`.

## Architecture

```text
MCP client
  -> stdio MCP
marvin-mini MCP server
  -> spawn child process
grok -p "prompt" --tools "<one x_* tool>" --output-format json
  -> Grok CLI uses the local login state to call xAI services
X/Twitter search results
```

Each MCP tool call is stateless: marvin-mini does not store sessions and does not reuse previous Grok processes.

## File Structure

```text
marvin-mini/
├── README.md
├── LICENSE
├── package.json
├── package-lock.json
├── src/
│   ├── index.mjs
│   ├── tools.mjs
│   ├── grok-cli.mjs
│   └── prompts.mjs
├── tests/
│   ├── grok-cli.test.mjs
│   ├── prompts.test.mjs
│   └── tools.test.mjs
└── docs/
    ├── cn/
    │   ├── README.md
    │   └── DOC.md
    └── en/
        ├── README.md
        └── DOC.md
```

## Module Overview

### `src/index.mjs`

MCP server entry point. It is responsible for:

- printing usage and exiting when run directly in an interactive terminal
- creating the `McpServer`
- registering tools
- connecting to MCP clients through `StdioServerTransport`

This file must not write logs to stdout, because stdout is used by the stdio MCP protocol. The interactive terminal usage message is written only to stderr.

### `src/tools.mjs`

Registers 5 MCP tools:

- `x_keyword_search`: keyword search that asks for visible text, date, author, and link
- `x_semantic_search`: semantic search that asks for visible text, date, author, and link
- `x_user_search`: user profile and recent-post search that asks for visible recent-post text, links, and quote/reply context
- `x_user_posts_search`: date-range post search for one user, intended for multi-day date sharding
- `x_thread_fetch`: thread context fetch with `summary`, `balanced`, and `deep` depth modes plus a result limit

Each tool is registered with `server.registerTool()` and describes its parameters with a Zod raw shape.

Optional `x_thread_fetch` parameters:

```json
{
  "mode": "summary | balanced | deep",
  "max_posts": 50,
  "timeout_seconds": 300
}
```

`timeout_seconds` controls only the internal Grok child-process timeout. If the MCP client also has a tool-call timeout, increase that client-side timeout too.

When tool execution fails, it returns an MCP tool error:

```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "marvin-mini error: ..."
    }
  ]
}
```

### `src/grok-cli.mjs`

Wraps Grok Build CLI child-process execution.

Key behavior:

- runs `grok` by default
- supports `MARVIN_GROK_BIN` to override the Grok CLI path
- always uses `--output-format json`
- each call runs for at most 120 seconds by default; thread calls can raise this to at most 600 seconds with `timeout_seconds`
- supports both a total timeout and a stdout/stderr idle timeout; active Grok output keeps the idle timeout alive
- stdout is capped at 1MB
- stderr keeps only the last 8192 characters
- Grok JSON output must contain a string `text` field

### `src/prompts.mjs`

Builds prompts passed to Grok CLI.

User inputs are wrapped with `JSON.stringify(...)` to reduce issues caused by quotes, newlines, or other prompt-disrupting characters.

## Parallel Orchestration

marvin-mini does not create agents inside the MCP server. Parallel agent work should be handled by the calling CLI.

Recommended patterns:

- Split multi-day searches by date, for example three days into three `x_user_posts_search` or `x_keyword_search` calls.
- Split broad searches by tool, for example user search, keyword search, and semantic search in parallel.
- For long threads, first fetch `summary` or `balanced` context, then run parallel `x_thread_fetch` calls on selected reply or quote URLs.
- The main agent should merge, dedupe, sort by time, preserve source links, and produce the final summary.

## Environment Variables

### `MARVIN_GROK_BIN`

When the MCP client process cannot find `grok`, use this variable to specify the absolute path to the Grok CLI binary:

```bash
MARVIN_GROK_BIN=/absolute/path/to/grok
```

## Testing

Run syntax checks:

```bash
npm run check
```

Run tests:

```bash
npm test
```

Tests use fake local Grok executables and do not require live network searches.

## Pre-Release Check

Before uploading to GitHub, run:

```bash
npm install
npm run check
npm test
npm pack --dry-run
```

Do not upload `node_modules/`.
