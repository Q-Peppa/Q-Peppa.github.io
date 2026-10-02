# MCP 服务器

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/mcp) 的中文翻译。仅供学习参考。

Pi 通过 stdio 或 streamable HTTP 连接 [Model Context Protocol](https://modelcontextprotocol.io) 服务器，并把它们的工具和资源提供给模型。

<a id="quick-setup"></a>

## 快速设置

添加本地 stdio 服务器，检查连接，然后启动 Pi：

```bash
pi mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .
pi mcp list
pi
```

远程服务器：

```bash
pi mcp add docs --url https://example.com/mcp --bearer-token-env-var DOCS_TOKEN
pi mcp list
```

这些命令默认添加用户级服务器。加 `--local` 或 `-l` 则写入项目配置：

```bash
pi mcp add -l tools --env API_KEY='${TOOLS_KEY}' -- uvx tools-mcp
```

在交互式会话里用 `/mcp` 查看连接、登录、重连、更改 exposure，或启用和禁用服务器。在会话外添加、移除或更改服务器后运行 `/reload`。

<a id="configure-servers"></a>

## 配置服务器

Pi 从 `~/.pi/agent/mcp.json` 读取用户级服务器，从 `.pi/mcp.json` 读取项目服务器。项目配置只在授予[项目信任](security.md#understand-project-trust)后读取。同名的项目条目会替换用户级条目。

没有 `command`、`url` 或 `type` 的项目条目只会覆盖同名用户级服务器的 `enabled`、`exposure` 和 `toolExposure`，其余配置（包括 `env`、`headers` 和 `auth`）保持不变。例如，在某个项目中关闭一个用户级服务器：

```json
{
  "mcpServers": {
    "internal-tools": { "enabled": false }
  }
}
```

格式与其他 MCP 客户端一致：

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
      "description": "Search and read the product documentation"
    }
  }
}
```

stdio 服务器使用 `command`、`args`、`env` 和 `cwd`。相对路径的 `cwd` 相对会话目录解析。`command`、参数或 `cwd` 以 `~/` 开头时表示家目录。

HTTP 服务器使用 `url`、`headers` 和 `oauth`（见 [用 OAuth 认证](#authenticate-with-oauth)）。不支持旧的 SSE 传输。

两种服务器都支持：

- `timeout`：每请求超时秒数（默认 60）。进度通知会重置计时。
- `enabled: false`：保留条目但不连接。
- `exposure` 和 `toolExposure`：控制工具如何到达模型（见 [控制工具暴露](#control-tool-exposure)）。
- `description`：一句话说明服务器提供什么。它会把服务器列在系统 Prompt 中（见 [控制工具暴露](#control-tool-exposure)），tool search 用它给该服务器的工具排序，codemode 的 `describeNamespace()` 会返回它。不设时，服务器连上后使用服务器 instructions 的第一行。

个人服务器和带凭证的服务器放在用户级文件。项目文件只放项目需要的服务器，且只在受信任的项目中使用。

### 配置规则

- 服务器名只能包含字母、数字、`_` 和 `-`。工具名为 `mcp__<server>__<tool>`，字母、数字和 `_` 以外的字符都会换成 `_`；同一服务器因此发生名称冲突的工具都会加哈希后缀。仅 `-` 和 `_` 不同的服务器名视为同一服务器：第二个会被拒绝，`mcp.json` 中的服务器会覆盖已注册的。
- `type` 可选。有 `command` 就是 stdio，有 `url` 就是 streamable HTTP。若写出 `type`，必须是 `stdio`、`http` 或 `streamable-http`。
- `sse` 会被拒绝。文档写 SSE 端点的服务器常常也提供 streamable HTTP，路径通常是 `/mcp` 而不是 `/sse`。
- `command` 是单个可执行文件，`args` 是它的参数，不是一整条 shell 命令字符串。
- `env` 和 `headers` 的值可以使用环境变量，例如 `${GITHUB_TOKEN}`。也可以用 `!command` 运行命令，但命令必须构成整个值，例如 `"Authorization": "!echo Bearer $(gh auth token)"`。
- 无效条目会被报告并跳过，不会阻止其他服务器连接。

`pi mcp add` 和 `pi mcp remove` 覆盖从 shell 做的常见改动。选项见 [MCP 命令](cli.md#mcp-commands)。

### 查看或更改服务器

`/mcp` 列出已配置服务器的状态、工具数、exposure 和配置来源。需要处理的服务器排在前面。选中一个服务器可以查看它的工具和连接详情、重连、登录或登出、更改 exposure，或启用和禁用它。

exposure 和启用状态的更改会保存到定义该服务器的文件，不替换无关内容。在受信任项目中，「在本项目启用」和「在本项目禁用」会为用户级服务器添加项目覆盖；之后对该服务器的更改会保存到覆盖中。禁用的服务器仍会列出。在交互式 TUI 之外，`/mcp` 打印服务器状态；`/mcp login <server>`、`/mcp logout <server>` 和 `/mcp reconnect <server>` 直接执行这些操作。

shell 命令不需要会话：`pi mcp add`、`pi mcp remove`、`pi mcp list`、`pi mcp login` 和 `pi mcp logout`。shell 命令不加载扩展。

### 诊断连接问题

运行 `pi mcp list` 连接每个已启用的服务器，并打印状态、工具和错误。配置条目无效或已启用服务器未连接时以状态 1 退出。`/mcp` 显示完整连接错误，以及失败的 stdio 服务器 stderr 的尾部。

Pi 在启动后报告一次配置错误、连接失败和需要登录的情况。服务器的 logging 通知会追加到 `~/.pi/agent/mcp.log`，格式为 `<time> [<server>] <level> <logger>: <message>`。文件超过 5 MB 后移到 `mcp.log.1`。

Pi 在会话启动时在后台连接每个已启用的服务器。服务器的工具在连上后出现；`codemode` 描述不列出它们，因此服务器连接时描述不会变。第一次 Prompt 只为带 `direct` 工具的服务器等待最多 10 秒，因为这些工具必须声明在请求中。其他服务器在需要时才等待：codemode 脚本会等待它点名的服务器（`mcp__<server>`），并在调用 `searchTools()` 或读取 `ALL_TOOLS` 时等待全部；`tool_search` 和资源工具也会等待全部。HTTP 网络错误和瞬时状态（408、429、5xx）会重试两次。掉线显示为 disconnected，并在下次调用时重连。服务器宣布工具列表变更时，新工具会被加入，撤回的工具变为不可达。

停止 stdio 服务器时会关闭它的 stdin，向进程组发送 SIGTERM，然后发送 SIGKILL。这样也会停掉通过 `npx` 或 `uvx` 等包装器启动的服务器。

## 从其他客户端迁移配置

把转换后的条目放到 `mcp.json` 的 `mcpServers` 下，然后运行 `pi mcp list` 校验。

| 客户端                                | 转换                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Desktop、Claude Code 或 Cursor | 复制现有的 `mcpServers` 条目。                                                                                                                                                        |
| VS Code                               | 从顶层 `servers` 对象移出条目，并把 `${input:...}` 提示换成 `${NAME}` 环境变量。                                                                                                      |
| Codex                                 | 把 `[mcp_servers.<name>]` 的 TOML 字段（如 `command`、`args`、`env`、`url`）转成 JSON。                                                                                               |
| OpenCode                              | 把 `"type": "local"` 转成 stdio 条目，把 `command` 数组拆成 `command` 和 `args`，把 `environment` 改名为 `env`，把 `{env:NAME}` 换成 `${NAME}`。把 `"type": "remote"` 转成 URL 条目。 |

<a id="authenticate-with-oauth"></a>
<a id="sign-in-with-oauth"></a>

## 用 OAuth 认证

使用 OAuth 的远程服务器（例如 Sentry）不需要在 `mcp.json` 里放凭证：

```json
{
  "mcpServers": {
    "sentry": { "url": "https://mcp.sentry.dev/mcp" }
  }
}
```

当服务器拒绝未认证的连接时，`/mcp` 会显示它需要登录。选择 "Sign in"、运行 `/mcp login sentry`，或运行 `pi mcp login sentry`。Pi 会打开授权页并等待批准。如果浏览器跑在另一台机器上（例如通过 SSH），把重定向后的 URL 粘贴到登录界面。正在运行的会话会在下一轮使用新凭证。

Pi 会向授权服务器注册自己，把 token 存在 `~/.pi/agent/mcp-auth.json`，并在过期或服务器拒绝时刷新 access token。如果服务器后来要求额外的 scope，Pi 会再次要求登录。登出会删除已存储的凭证。

凭证属于服务器名加 URL。同一 URL 下不同名称的服务器（例如每个账号一个）各自登录；不同 `mcp.json` 文件中同名同 URL 的服务器共用一次登录。

OAuth 适用于没有 `Authorization` header 的 HTTP 服务器。对于不支持 dynamic client registration 的服务器，配置一个已注册的客户端：

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

重定向 URI 必须与已注册的 URI 一致。`callbackPort` 使用 `http://127.0.0.1:<port>/callback`。若要用别的 URI，设置 `callbackUrl`；它必须是 `localhost`、`127.0.0.1` 或 `[::1]` 上的 HTTP。Pi 按原样发送。`callbackUrl` 省略端口时，Pi 使用 `callbackPort` 或一个空闲端口，并把它加到 URI 上，这是 RFC 8252 对 loopback 重定向所允许的。`clientSecret` 可选，可以使用环境变量或命令。

对不公布所需 scope 的服务器，把 `scope` 设为空格分隔的列表。否则 Pi 请求公布的 scope。之后的 scope 请求会加到已配置的值上。

Pi 注册时使用名称 `pi`。有些服务器只接受已知客户端的注册。设置 `clientName` 以发送另一个名称：

```json
{
  "mcpServers": {
    "figma": { "url": "https://mcp.figma.com/mcp", "oauth": { "clientName": "Claude Code" } }
  }
}
```

该名称只在 Pi 注册客户端时发送。要在新名称下重新注册，先登出。

有些授权服务器按 Client ID Metadata Document URL 识别客户端，而不是让它们注册。把 `clientRegistration` 设为 `cimd`，即可用 pi.dev 上 Pi 的文档标识自己，而不是注册：

```json
{
  "mcpServers": {
    "example": { "url": "https://mcp.example.com/mcp", "oauth": { "clientRegistration": "cimd" } }
  }
}
```

客户端 ID 是 `https://pi.dev/oauth/client.json`，重定向 URI 是 `http://127.0.0.1:<port>/callback`。如果授权服务器在授权响应中不发送 `iss` 参数（RFC 9207），Pi 会改用针对该 MCP 服务器的文档和重定向路径：`https://pi.dev/oauth/<id>/client.json` 与 `http://127.0.0.1:<port>/callback/<id>`。授权服务器必须公布对 Client ID Metadata Document 和公共客户端的支持，否则登录会失败。`cimd` 不能与 `clientId` 或 `clientName` 同时使用，且 `callbackUrl` 必须使用 `localhost` 或 `127.0.0.1`，路径为 `/callback`。

Pi 通过服务器的受保护资源元数据（RFC 9728）查找授权服务器，并检查授权服务器元数据是否写出预期的 issuer（RFC 8414）。有些服务器公布了错误的授权服务器，或什么都不公布，登录就会打开一个不存在的页面。把 `authServerMetadataUrl` 设为正确授权服务器的元数据文档：

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "oauth": { "authServerMetadataUrl": "https://example.okta.com/.well-known/openid-configuration" }
    }
  }
}
```

Pi 用该文档代替发现，并按配置信任它，所以只指向你信任的文档。URL 必须使用 HTTPS，`localhost`、`127.0.0.1` 或 `[::1]` 除外。

<a id="control-tool-exposure"></a>
<a id="exposure"></a>

## 控制工具暴露

每个服务器工具注册为 `mcp__<server>__<tool>`。服务器的 `exposure` 决定模型如何到达它：

| Exposure           | 行为                                                                                                                                                   | 典型用途                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `codemode`（默认） | 可从 [`codemode`](cli.md#tools) 脚本调用，既不向模型声明，也不列在 codemode 描述中。脚本用 `searchTools()`、`describeTool()` 或 `ALL_TOOLS` 查找工具。 | 一般 MCP 服务器，尤其是脚本需要组合或过滤调用时。 |
| `deferred`         | 在 [`tool_search`](cli.md#tools) 为下一次模型调用加载匹配项之前不声明。                                                                                | 发现后应直接调用工具的大型服务器。                |
| `direct`           | 像内置工具一样向模型声明，也可以从 codemode 调用。                                                                                                     | 小型、常用的工具集。                              |
| `hidden`           | 已注册但不可达。                                                                                                                                       | 应保持不可用的服务器或工具。                      |

`codemode-deferred` 被接受为 `codemode` 的别名。

带 `codemode` 或 `deferred` 工具的服务器会列在系统 Prompt 的 `mcp_servers` 分区，写出工具如何到达，以及配置的 `description` 中的一行；连上后则用服务器 instructions。Pi 在 Prompt 开始时、等待带 `direct` 工具的服务器之后更新该分区。分区有变化时（例如服务器连上、摘要可用），Pi 把新分区追加到对话，而不是改工具声明，这样更早的消息可以继续走缓存。`describeNamespace()` 和 `searchTools()` 的 `namespace` 选项接受 `mcp__dev-radius`、`mcp__dev_radius`、`dev-radius` 或 `dev_radius`。

带 `codemode` exposure 的服务器连上时，Pi 会激活 `codemode`。带 `deferred` exposure 的服务器会激活 `tool_search`。要让模型不经搜索就看到某个工具，用 `toolExposure` 给它 `direct` exposure。

`toolExposure` 覆盖单个工具的服务器 exposure。键是精确的服务器工具名，或 `*` 匹配任意字符的模式。精确名称优先于模式；多个模式中，第一个匹配的胜出。`hidden` exposure 的服务器可以只暴露选定的工具：

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

`pi mcp list` 会标记 exposure 与服务器不同的工具。`/mcp` 的 Tools 视图也会显示有效 exposure。

带 `codemode` 或 `deferred` exposure 的工具可以通过这两种间接机制到达：codemode 脚本可以调用它们，`tool_search` 可以加载它们。codemode 调用不依赖活动工具集，所以在 `/tree`、恢复和 fork 之后仍可用。`tool_search` 加载的工具会记入转录，并在该分支上保持声明。

即使没有 MCP 服务器也要保持 `codemode` 激活，把 `"defaultTools": ["+codemode"]` 加到[设置](settings.md#tools)。若要阻止自动激活 codemode，在 `mcpServers` 旁边设置 `"autoEnableCodemode": false`。项目值会覆盖用户级值。`codemode` 和 `tool_search` 都未激活、非 direct 工具无法被调用时，Pi 会警告一次。

超过 20 KB 的文本结果到达模型时会切掉中间，夹着 `…N chars truncated…` 标记。完整文本保存到结果中写出的临时文件。codemode 脚本收到完整结果，可以在返回给模型之前再压缩。

codemode 脚本收到完整的 MCP `CallToolResult`，包括 `content`、`structuredContent` 和 `isError`。带 `isError` 的结果在脚本中会 resolve，对直接调用则作为错误报告。`image(result.content[0])` 转发图片块。服务器 instructions 不属于任何工具描述；脚本用 `describeNamespace("mcp__<server>")` 读取它们，同时也会返回该服务器的工具名。

<a id="use-resources"></a>

## 使用资源

已连接的服务器提供 [resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) 时，Pi 会添加 Codex 和 OpenCode 使用的资源工具：

- `list_mcp_resources` 以 JSON 列出资源：`{ server?, resources: [{ server, uri, name, ... }], nextCursor? }`。带 `server` 时列出一页，`cursor` 继续下一页。不带 `server` 则列出每个服务器的全部资源。
- `list_mcp_resource_templates` 列出服务器未直接列出的资源 URI 模板。
- `read_mcp_resource` 按 `server` 和 `uri` 读取资源。文本作为文本到达模型，图片作为图片。其他二进制资源保存到临时文件，模型收到路径。脚本收到 `{ server, uri, contents }`。

这些工具覆盖每个已启用、非 hidden 且提供资源的服务器。它们的 exposure 取这些服务器中最宽的：先 `direct`，然后 `codemode` 或 `deferred`。工具结果中的资源链接会标明 `read_mcp_resource` 和服务器。

MCP Apps 的资源（`ui://` URI 或 `text/html;profile=mcp-app`）会省略，因为 Pi 不渲染它们。资源图标也省略。

读取和列出资源在瞬时 HTTP 错误（408、429 或 5xx）后会重试一次。工具调用不重试，因为服务器可能已经执行过。

## 权限

每个 MCP 调用都走 Pi 的工具管道。因此扩展的 `tool_call` 和 `tool_result` 处理器（包括权限门禁）也适用于 MCP 工具。从 codemode 脚本发出的调用带有该 codemode 调用的 ID 作为 `parentToolCallId`。

`pi.getAllTools()` 报告每个服务器声明的 annotations：`readOnlyHint`、`destructiveHint`、`idempotentHint` 和 `openWorldHint`。权限扩展可以用这些提示决定哪些调用需要确认（见[工具暴露](extensions.md#tool-exposure)）。资源工具标记为只读。

<a id="extensions-and-sdk"></a>

## 扩展与 SDK

### 从扩展添加服务器

扩展可以用 `pi.registerMcpServer(name, config)` 为当前会话添加服务器，形状与 `mcpServers` 条目相同（见[扩展中的 MCP 服务器](extensions.md#mcp-servers)）。已注册的服务器像已配置的服务器一样连接，并在 `/mcp` 中以来源为扩展显示。

启用状态或 exposure 的更改只作用于当前会话。文件中配置的同名服务器优先，`/mcp` 会列出被覆盖的注册。`pi mcp` shell 命令不加载扩展，只看到文件中配置的服务器。

<a id="other-mcp-extensions"></a>

### 替换内置 MCP 支持

已安装的扩展如果注册了 `/mcp`（例如 `pi-mcp-adapter`），会替换会话中的内置 MCP 支持。Pi 之后既不读取 `mcp.json`，也不在会话中连接它的服务器，`/mcp` 属于该扩展。移除扩展即可恢复内置行为。不安装替代就关掉内置 MCP 支持，在 `pi config` 的 Built-in 下禁用 `mcp`，或在[设置](settings.md#resources)中设 `"extensions": ["-builtin:mcp"]`。

注册 `codemode` 或 `tool_search` 的扩展同样会替换该名称的内置工具。shell 级 `pi mcp` 命令始终使用内置实现。

### 从 SDK 使用 MCP

SDK 会话不加载内置扩展。把 MCP 扩展、用于 `codemode` 服务器的 codemode 扩展，以及用于 `deferred` 服务器的 tool-search 扩展加到 resource loader。见 [Codemode 与 MCP](sdk.md#codemode-mcp)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
