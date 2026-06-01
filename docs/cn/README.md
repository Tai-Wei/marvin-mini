# marvin-mini 中文说明

marvin-mini 是一个轻量级 MCP server，用本机已登录的 Grok Build CLI 为其他 MCP 客户端提供 X/Twitter 搜索能力。

它不直接调用 xAI API。每次 MCP 工具调用都会启动一个独立的 `grok -p` headless 进程，并通过 Grok CLI 内置的 X 搜索工具完成查询。

## 项目信息

- GitHub: <https://github.com/Tai-Wei/marvin-mini>
- 作者: [Taiwei (@Tai-Wei)](https://github.com/Tai-Wei)
- 许可证: Apache-2.0

## 适用场景

marvin-mini 适合只需要 X/Twitter 搜索能力的 MCP 客户端，例如：

- Claude Code
- Codex CLI
- Gemini CLI
- Cursor
- Cline

如果未来需要接入 review、rescue、swarm 等更完整的 Grok 能力，建议新建完整项目 `marvin`，并把本项目作为 X 搜索模块复用或参考。

## 前置要求

- Node.js >= 18.18.0
- 已安装 Grok Build CLI
- 已执行 `grok login`

安装依赖：

```bash
npm install
```

## 安装方式

发布到 npm 后，客户端可以直接用 `npx` 运行：

```bash
npx -y marvin-mini
```

也可以全局安装：

```bash
npm install -g marvin-mini
marvin-mini
```

## MCP 工具

marvin-mini 暴露 4 个 MCP 工具：

- `x_keyword_search`: 按关键词搜索 X/Twitter 帖子
- `x_semantic_search`: 按语义或自然语言意图搜索 X/Twitter 帖子
- `x_user_search`: 搜索 X/Twitter 用户资料和近期帖子
- `x_thread_fetch`: 获取某条 X/Twitter 帖子的完整线程

每个 MCP 工具只允许 Grok 使用对应的一个内置 X 工具，避免 prompt 跑偏。

## 客户端配置

### Codex CLI

```bash
codex mcp add marvin-mini -- npx -y marvin-mini
```

如果客户端找不到 `grok`，请显式设置 Grok CLI 路径：

```bash
codex mcp add marvin-mini --env MARVIN_GROK_BIN=/absolute/path/to/grok -- npx -y marvin-mini
```

### Claude Code

在 `~/.claude/settings.json` 或项目 `.claude/settings.json` 中添加：

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

如果 `grok` 已经在 MCP server 进程的 `PATH` 中，`env` 可以省略。

发布到 npm 后，支持 command/args 的 MCP 客户端也可以使用：

```json
{
  "mcpServers": {
    "marvin-mini": {
      "command": "npx",
      "args": ["-y", "marvin-mini"],
      "env": {
        "MARVIN_GROK_BIN": "/absolute/path/to/grok"
      }
    }
  }
}
```

## 注意事项

GUI 客户端或系统服务启动 MCP server 时，可能使用不同的 `PATH` 或 `HOME`。即使 `grok` 路径正确，如果 `HOME` 不是运行过 `grok login` 的用户目录，Grok CLI 仍可能表现为未登录。

## 更多文档

完整设计和实现说明见：[DOC.md](DOC.md)
