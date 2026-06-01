# marvin-mini 中文文档

## 设计目标

marvin-mini 的目标是提供一个尽可能小的 MCP server，让支持 MCP 的客户端可以通过本机 Grok Build CLI 搜索 X/Twitter。

当前版本只聚焦 X/Twitter 搜索，不包含完整 Grok 能力。这个边界是有意保留的：`marvin-mini` 适合作为轻量工具，未来完整版本可以命名为 `marvin`。

## 架构

```text
MCP 客户端
  -> stdio MCP
marvin-mini MCP server
  -> spawn 子进程
grok -p "prompt" --tools "<one x_* tool>" --output-format json
  -> Grok CLI 使用本机登录态调用 xAI 服务
X/Twitter 搜索结果
```

每个 MCP 工具调用都是无状态的：marvin-mini 不保存会话，也不会复用上一次 Grok 进程。

## 文件结构

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

## 模块说明

### `src/index.mjs`

MCP server 入口，负责：

- 交互终端直接运行时打印用法并退出
- 创建 `McpServer`
- 注册工具
- 通过 `StdioServerTransport` 连接 MCP 客户端

该文件不能向 stdout 写日志，否则会破坏 stdio MCP 协议。交互终端用法提示只写入 stderr。

### `src/tools.mjs`

注册 5 个 MCP 工具：

- `x_keyword_search`: 关键词搜索，要求返回可见正文、时间、作者和链接
- `x_semantic_search`: 语义搜索，要求返回可见正文、时间、作者和链接
- `x_user_search`: 用户资料和近期帖子搜索，要求近期帖子尽量包含可见正文、链接和引用/回复上下文
- `x_user_posts_search`: 某个用户在日期范围内的帖子搜索，用于多天检索的日期分片
- `x_thread_fetch`: 线程上下文获取，支持 `summary`、`balanced`、`deep` 深度模式和结果上限

每个工具使用 `server.registerTool()` 注册，并使用 Zod raw shape 描述参数。

`x_thread_fetch` 的可选参数：

```json
{
  "mode": "summary | balanced | deep",
  "max_posts": 50,
  "timeout_seconds": 300
}
```

`timeout_seconds` 只控制 marvin-mini 内部 Grok 子进程的总超时。MCP 客户端如果也有工具调用超时，仍需要在客户端配置中调高。

工具执行失败时会返回 MCP tool error：

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

封装 Grok Build CLI 子进程调用。

关键行为：

- 默认执行 `grok`
- 支持 `MARVIN_GROK_BIN` 覆盖 Grok CLI 路径
- 固定使用 `--output-format json`
- 默认单次调用最多运行 120 秒，线程工具可通过 `timeout_seconds` 提高到最多 600 秒
- 支持总超时和 stdout/stderr 空闲超时；只要 Grok 持续输出活动，就不会被空闲超时提前结束
- stdout 上限 1MB
- stderr 只保留最后 8192 字符
- 校验 Grok JSON 输出必须包含字符串类型的 `text` 字段

### `src/prompts.mjs`

构造传给 Grok CLI 的 prompt。

用户输入会使用 `JSON.stringify(...)` 包裹，降低引号、换行等字符造成 prompt 混乱的风险。

## 并行编排建议

marvin-mini 不在 MCP server 内部创建 agents。多 agents 并行应由调用方 CLI 负责。

建议模式：

- 多天检索按日期分片，例如三天内容拆成三个 `x_user_posts_search` 或 `x_keyword_search` 调用。
- 宽主题检索按工具分片，例如同时运行用户搜索、关键词搜索、语义搜索。
- 长线程先用 `summary` 或 `balanced` 获取上下文，再对关键回复或引用链接并行调用 `x_thread_fetch`。
- 主 agent 负责合并、去重、按时间排序、保留来源链接并输出总结。

## 环境变量

### `MARVIN_GROK_BIN`

当 MCP 客户端启动的进程找不到 `grok` 时，使用该变量指定 Grok CLI 的绝对路径：

```bash
MARVIN_GROK_BIN=/absolute/path/to/grok
```

## 测试

运行语法检查：

```bash
npm run check
```

运行测试：

```bash
npm test
```

测试使用假的本地 Grok 可执行文件，不依赖真实网络搜索。

## 发布前检查

上传 GitHub 前建议确认：

```bash
npm install
npm run check
npm test
npm pack --dry-run
```

不要上传 `node_modules/`。
