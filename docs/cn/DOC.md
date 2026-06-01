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

注册 4 个 MCP 工具：

- `x_keyword_search`
- `x_semantic_search`
- `x_user_search`
- `x_thread_fetch`

每个工具使用 `server.registerTool()` 注册，并使用 Zod raw shape 描述参数。

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
- 单次调用最多运行 120 秒
- stdout 上限 512KB
- stderr 只保留最后 8192 字符
- 校验 Grok JSON 输出必须包含字符串类型的 `text` 字段

### `src/prompts.mjs`

构造传给 Grok CLI 的 prompt。

用户输入会使用 `JSON.stringify(...)` 包裹，降低引号、换行等字符造成 prompt 混乱的风险。

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
