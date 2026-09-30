# MCP 服务器

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/mcp) 的中文翻译。仅供学习参考。

Pi 通过 stdio 或 streamable HTTP 连接 [Model Context Protocol](https://modelcontextprotocol.io) 服务器，并把它们的工具提供给模型。

## 配置服务器

把服务器加到 `~/.pi/agent/mcp.json`，或项目里的 `.pi/mcp.json`。格式与其他 MCP 客户端一致，所以现有的 `mcpServers` 条目可以直接复制过来：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "docs": {
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer ${DOCS_TOKEN}" },
      "exposure": "direct"
    }
  }
}
```

- stdio 服务器使用 `command`、`args`、`env` 和 `cwd`。相对路径的 `cwd` 相对会话目录解析。`command`、参数或 `cwd` 以 `~/` 开头时表示家目录。
- HTTP 服务器使用 `url`、`headers` 和 `oauth`（见 [用 OAuth 登录](#sign-in-with-oauth)）。不支持旧的 SSE 传输。
- `env` 和 `headers` 的值可以引用环境变量（`${NAME}`）或命令（`!command`），与 Provider API Key 相同。
- `timeout` 设置每请求超时秒数（默认 60）。服务器发来的进度通知会重置计时。
- `enabled: false` 保留条目但不连接。

项目条目会替换同名的全局条目。项目的 `mcp.json` 只在项目受信任后读取，因为 stdio 服务器会执行命令。

`pi mcp add` 和 `pi mcp remove` 可从 shell 编辑该文件（见 [MCP 命令](cli.md#mcp-commands)）：

```bash
pi mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .
pi mcp add docs --url https://example.com/mcp --bearer-token-env-var DOCS_TOKEN --exposure direct
pi mcp add -l tools --env API_KEY='${TOOLS_KEY}' -- uvx tools-mcp
pi mcp remove docs
```

容易写错的规则：

- 服务器名只能包含字母、数字、`_` 和 `-`。工具名为 `mcp__<server>__<tool>`。
- `type` 可选：有 `command` 就是 stdio 服务器，有 `url` 就是 streamable HTTP 服务器。若写出 `type`，必须是 `stdio`、`http` 或 `streamable-http`。`sse` 会被拒绝；多数文档写 SSE 端点的服务器也提供 streamable HTTP，路径常常是 `/mcp` 而不是 `/sse`。
- `command` 是单个可执行文件，`args` 是它的参数，不是一整条 shell 字符串。
- 不要把密钥写进文件：用 `${NAME}` 引用环境变量，例如 `"Authorization": "Bearer ${GITHUB_TOKEN}"`，或用 `!command` 运行命令。命令必须构成整个值，所以它自己要打印 header 值：`"Authorization": "!echo Bearer $(gh auth token)"`。
- 无效条目会被跳过并报告；其他服务器仍会连接。

## 设置服务器

当被要求添加 MCP 服务器时，agent 应当：

1. 简单服务器用 `pi mcp add`（项目文件加 `-l`），命令覆盖不到的设置再直接编辑 `mcp.json`。个人服务器和带凭证的服务器放进 `~/.pi/agent/mcp.json`。项目 `.pi/mcp.json` 只放项目自身需要的服务器，且只在受信任的项目中使用。
2. 转换其他客户端写的条目：
   - Claude Desktop、Claude Code 和 Cursor 使用相同的 `mcpServers` 形状；直接复制条目。
   - VS Code 使用顶层 `servers` 对象和 `inputs` 提示；把条目移到 `mcpServers` 下，并把 `${input:...}` 换成 `${NAME}` 环境变量。
   - Codex 使用 TOML（`[mcp_servers.<name>]`，字段为 `command`、`args`、`env` 或 `url`）；把同样的字段写成 JSON。
   - opencode 使用 `"type": "local"` 且 `command` 为数组（拆成 `command` 和 `args`），URL 用 `"type": "remote"`，`environment` 对应 `env`，`{env:NAME}` 对应 `${NAME}`。
3. 运行 `pi mcp list` 检查条目。它会连接每个已启用的服务器，并打印状态、工具，以及错误（例如未能启动的 stdio 服务器的 stderr）。有任何问题就以状态 1 退出。
4. 需要登录的服务器运行 `pi mcp login <server>`。它会在用户浏览器中打开授权页并等待用户批准访问；告诉用户去批准。正在运行的会话会在下一轮使用新凭证。
5. 告诉用户运行 `/reload`（或开一个新会话），好让正在运行的会话连上新增或已改动的服务器。

Pi 在会话启动时连接。第一条 Prompt 会为启动连接等待最多 10 秒；更久才连上的服务器，其工具会在连上后可用。因网络错误或瞬时状态（408、429、5xx）失败的 HTTP 连接会重试两次。掉线的服务器显示为 disconnected，并在下次调用时重连。服务器宣布工具列表变更时，新工具会被加入；撤回的工具在服务器再次提供之前不可达。

配置错误、连接失败的服务器，以及需要登录的服务器，会在启动后报告一次。

服务器通过 MCP logging 通知发出的日志会追加到 `~/.pi/agent/mcp.log`，格式为 `<time> [<server>] <level> <logger>: <message>`。文件超过 5 MB 时会移到 `mcp.log.1`。

## 管理服务器

`/mcp` 打开服务器管理器。它列出每个已配置服务器的状态、工具数、exposure，以及来自全局还是项目 `mcp.json`；需要处理的服务器排在前面。选中一个服务器可以：

- 登录，适用于需要 OAuth 的服务器（见 [用 OAuth 登录](#sign-in-with-oauth)）
- 查看它的工具、命令或 URL，以及完整连接错误，包括 stdio 服务器 stderr 的尾部
- 重连
- 登出，会删除已存储的 OAuth 凭证
- 更改它的 exposure（见 [Exposure](#exposure)）
- 禁用或启用它

更改 exposure 以及启用或禁用会保存到定义该服务器的 `mcp.json`；文件的其他内容保留。禁用的服务器仍会列出，以便再次启用。

在交互式 TUI 之外，`/mcp` 打印服务器状态。`/mcp login <server>`、`/mcp logout <server>` 和 `/mcp reconnect <server>` 直接执行这些操作。

在 shell 中，`pi mcp add`、`pi mcp remove`、`pi mcp list`、`pi mcp login <server>` 和 `pi mcp logout <server>` 可在没有会话的情况下管理服务器（见 [MCP 命令](cli.md#mcp-commands)）。

停止 stdio 服务器时会关闭它的 stdin，然后向整个进程组发送 SIGTERM，最后是 SIGKILL，这样通过 `npx` 或 `uvx` 等包装器启动的服务器不会残留。

<a id="sign-in-with-oauth"></a>

## 用 OAuth 登录

使用 OAuth 的远程服务器（例如 Sentry）不需要在 `mcp.json` 里放凭证：

```json
{
  "mcpServers": {
    "sentry": { "url": "https://mcp.sentry.dev/mcp" }
  }
}
```

当这样的服务器拒绝连接时，`/mcp` 会显示它需要登录。选中它并选择 "Sign in"（或运行 `/mcp login sentry`，或在 shell 中运行 `pi mcp login sentry`）会在浏览器中打开授权页。你批准访问后，浏览器会重定向到 `127.0.0.1` 上的临时服务器，pi 随即连接。如果浏览器跑在另一台机器上（例如通过 SSH），把重定向后的 URL 粘贴到登录界面即可。

Pi 会向授权服务器注册自己（dynamic client registration），把 token 存在 `~/.pi/agent/mcp-auth.json`，并在过期或服务器拒绝时自动刷新 access token。如果服务器后来要求比已授予更多的 scope，它会再次显示为需要登录，登录时会请求新的 scope。`/mcp` 中的 "Sign out"（或 `/mcp logout sentry`）会删除已存储的凭证。

OAuth 适用于没有 `Authorization` header 的 HTTP 服务器。对于不支持 dynamic client registration 的授权服务器，配置一个预先注册的客户端：

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "oauth": { "clientId": "my-client", "clientSecret": "${EXAMPLE_SECRET}", "callbackPort": 8765 }
    }
  }
}
```

重定向 URI 必须与为该客户端注册的 URI 一致。`callbackPort` 把它固定为 `http://127.0.0.1:<port>/callback`。若要用别的重定向 URI，设置 `callbackUrl`，例如 `"callbackUrl": "http://localhost:8080/oauth/callback"`。它必须是 `localhost`、`127.0.0.1` 或 `[::1]` 上的 `http` URI，并按原样发送。`callbackUrl` 没有端口时，pi 监听 `callbackPort` 或一个空闲端口，并把它加到 URI 上；授权服务器对 loopback 重定向接受任意端口（RFC 8252）。`clientSecret` 可选，可以引用环境变量或命令。

`scope` 设置要请求的 scope，以空格分隔，用于不公布所需 scope 的服务器。不设时，pi 请求服务器公布的 scope。服务器后来要求更多 scope 时，pi 会在 `scope` 之上再请求那些。

## Exposure

每个服务器的工具注册为 `mcp__<server>__<tool>`。`exposure` 设置控制模型如何到达它们：

- `codemode`（默认）：工具可从 [`codemode`](cli.md#tools) 脚本调用，并列在 `codemode` 工具的描述中，但不会向模型声明。大型 MCP 工具列表不会进入模型的工具声明；脚本可以调用多个 MCP 工具（需要时并行），只把模型需要的那部分结果返回。这类服务器连上时，Pi 会激活 `codemode` 工具。大型服务器不会填满描述：声明共享一个 Token 预算，脚本用 `searchTools()` 查找其余工具（见 [`codemode`](cli.md#tools)）。
- `codemode-deferred`：类似 `codemode`，但工具也不会列在 `codemode` 工具的描述中；描述只写出服务器名和工具数量。脚本按名称调用它们，并用 `searchTools()` 或 `ALL_TOOLS` 查找。适合 codemode 脚本很少用到的大型服务器。
- `deferred`：在 [`tool_search`](cli.md#tools) 工具加载它们之前，不会向模型声明。模型搜索后，匹配项从下一次调用起被声明，并直接调用，不经过 codemode。这类服务器连上时，Pi 会激活 `tool_search` 工具。适合不用 codemode 的大型服务器。
- `direct`：工具像内置工具一样向模型声明，也可以从 codemode 调用。
- `hidden`：工具已注册但不能被调用。

`toolExposure` 设置单个工具的 exposure，并覆盖该工具的 `exposure`。键是服务器提供的工具名，或 `*` 匹配任意字符的模式。精确名称优先于模式；多个模式中，对象里第一个匹配的胜出。服务器 exposure 为 `hidden` 时，只有列出的工具可达：

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "exposure": "deferred",
      "toolExposure": {
        "search_code": "direct",
        "get_*": "codemode",
        "delete_*": "hidden"
      }
    }
  }
}
```

`pi mcp list` 会标记 exposure 与服务器不同的工具，`/mcp` 的 Tools 视图也会显示。

未向模型声明的工具（`codemode`、`codemode-deferred` 和 `deferred` exposure）可以通过这两种工具到达：codemode 脚本可以调用全部，`tool_search` 可以加载其中任意一个。例如，`codemode` 激活时，脚本可以调用 `deferred` 服务器的工具；`tool_search` 激活时，模型可以加载 `codemode` 服务器的工具。

从 codemode 脚本调用的工具不依赖活动工具集，所以在 `/tree`、恢复和 fork 之后仍可调用。`tool_search` 加载的工具会像其他工具变更一样记入转录，并在该分支上保持声明。即使没有 MCP 服务器也要保持 `codemode` 激活，把 `"defaultTools": ["+codemode"]` 加到[设置](settings.md#tools)。若要阻止 Pi 激活 `codemode` 工具，在 `mcp.json` 顶层、`mcpServers` 旁边设置 `"autoEnableCodemode": false`。项目 `mcp.json` 的值会覆盖全局值。`codemode` 和 `tool_search` 都未激活时，Pi 会警告一次，因为此时这些工具无法被调用。

超过 20KB 的文本结果到达模型时会切掉中间，格式与 Codex 相同：文本首尾夹着 `…N chars truncated…` 标记。完整文本保存到临时文件，结果里写出路径。codemode 脚本始终收到完整结果，所以脚本可以把大结果过滤成模型需要的部分。

codemode 脚本收到 MCP 工具的完整 `CallToolResult`（服务器发出的 `content` 块、`structuredContent` 和 `isError`），`codemode` 描述把它声明为 `CallToolResult<T>`。带 `isError` 的结果在脚本中会 resolve，对直接调用则作为错误报告给模型。`image(result.content[0])` 把图片块转发给模型。服务器的 `instructions` 会在 `codemode` 描述中说明它的工具。

## 资源

已连接的服务器提供 [resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) 时，pi 会添加 Codex 和 opencode 使用的资源工具：

- `list_mcp_resources` 以 JSON 列出资源：`{ server?, resources: [{ server, uri, name, ... }], nextCursor? }`。带 `server` 时列出该服务器的一页，`cursor` 继续下一页。不带则列出每个服务器的全部资源。
- `list_mcp_resource_templates` 以同样方式列出服务器未列出的资源 URI 模板。
- `read_mcp_resource` 按 `server` 和 `uri` 读取资源。文本资源作为文本到达模型，图片作为图片；其他二进制资源保存到临时文件，模型看到文件路径。脚本收到 `{ server, uri, contents }`。

这些工具覆盖每个已启用、exposure 不是 `hidden` 且提供资源的服务器，并取其中最宽的 exposure：有一个服务器是 `direct` 就是 `direct`，否则 `codemode`，否则 `codemode-deferred`，否则 `deferred`。工具结果中的资源链接会写出 `read_mcp_resource` 和服务器。

MCP Apps 的资源（`ui://` URI 或 `text/html;profile=mcp-app`）不列入列表，因为 pi 不渲染它们；资源图标也不列入。

读取和列出资源在瞬时 HTTP 错误（408、429、5xx）后会重试一次。工具调用不重试，因为服务器可能已经执行过。

## 权限

每个 MCP 调用都走 pi 的工具管道，所以 `tool_call` 和 `tool_result` 扩展处理器（包括权限门禁）也适用于 MCP 工具。从 codemode 脚本发出的调用带有该 `codemode` 调用的 id 作为 `parentToolCallId`。`pi.getAllTools()` 报告服务器声明的工具 annotations（`readOnlyHint`、`destructiveHint`、`idempotentHint`、`openWorldHint`），权限扩展可以只确认会改动东西的调用（见[扩展](extensions.md#tool-exposure)）。资源工具标记为只读。

## 来自扩展的服务器

扩展可以用 `pi.registerMcpServer(name, config)` 为当前会话添加服务器，配置形状与 `mcp.json` 相同（见[扩展](extensions.md#mcp-servers)）。它们像已配置的服务器一样连接，并在 `/mcp` 中以来源为扩展显示。对它们的启用、禁用和 exposure 更改只作用于当前会话。`mcp.json` 中的同名服务器优先；`/mcp` 会列出被覆盖的注册。`pi mcp` shell 命令不加载扩展，只看到 `mcp.json` 中的服务器。

<a id="other-mcp-extensions"></a>

## 其他 MCP 扩展

已安装的扩展如果注册了 `/mcp` 命令（例如 `pi-mcp-adapter`），会替换内置 MCP 支持：pi 之后既不在会话中读取 `mcp.json`，也不连接服务器，`/mcp` 属于该扩展。要使用内置支持，移除该扩展。不安装其他扩展就关掉内置支持，在 `pi config` 的 Built-in 下禁用 `mcp`，或在[设置](settings.md#resources)中设 `"extensions": ["-builtin:mcp"]`；`pi mcp` shell 命令仍然可用。同样，注册名为 `codemode` 或 `tool_search` 的工具的扩展会替换该名称的内置工具。`pi mcp` shell 命令始终使用内置支持。

## SDK

SDK 会话不加载内置扩展。把 MCP 扩展、用于 `codemode` 和 `codemode-deferred` 服务器的 codemode 扩展，以及用于 `deferred` 服务器的 tool search 扩展加到 resource loader。见 [SDK](sdk.md#codemode-mcp)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
