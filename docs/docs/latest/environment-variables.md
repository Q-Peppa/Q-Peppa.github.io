# 环境变量

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/environment-variables) 的中文翻译。仅供学习参考。

Pi 以三种方式使用环境变量：

- `PI_OFFLINE` 这类变量用于配置 Pi 进程。
- Pi 设置进程标记，让子进程能识别 Pi 是启动它的 Agent。
- LLM 可调用的 Shell 工具所运行的命令会收到描述当前会话的 `PI_*` 变量。

Provider API Key 变量在 [Provider 认证](providers.md#use-an-api-key-from-the-environment)中单独记录。

## 进程标记

CLI 和 RPC 入口点设置两个进程标记：

- `AI_AGENT=pi` 是通用标记，让工具链能识别 Pi 是启动该进程的 Agent。
- `PI_CODING_AGENT=true` 是 Pi 专用的，让子进程能检测到自己运行在 Pi 中。

子进程继承这两个标记。它们与具体会话无关，通过 SDK 嵌入 Pi 时不会自动设置。

## Shell 工具的会话环境

由 `bash` 和 `powershell` 工具运行的命令会收到当前 Pi 会话状态：

| 变量                 | 说明                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| `PI_SESSION_ID`      | 当前会话 ID                                                                     |
| `PI_SESSION_FILE`    | 当前会话 JSONL 文件的绝对路径；临时会话不设置                                   |
| `PI_PROVIDER`        | 当前选中的模型 Provider                                                         |
| `PI_MODEL`           | 当前选中的模型 ID                                                               |
| `PI_REASONING_LEVEL` | 当前生效的推理级别：`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max` |

这些值在每条命令启动时解析。因此更换模型或改变推理级别会影响下一条 Shell 命令，而无需重启 Pi。`PI_PROVIDER` 和 `PI_MODEL` 标识 Pi 选中的模型，而不是 router 可能在内部选择的其他上游模型。

被问到正在运行哪个模型或 Provider 时，请检查这些变量，而不要从系统提示推断：

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

会话持久化时可以直接检查会话文件：

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

这些变量会注入到 LLM 可调用的 `bash` 和 `powershell` 工具中。它们不会注入到用户输入的 `!` 或 `!!` 命令。

### 自定义 Shell 工具

用 `createBashTool()` 或 `createPowerShellTool()` 创建的工具在通过 Pi 注册时默认暴露会话环境。注入发生在 `spawnHook` 之前，所以钩子会在 `ctx.env` 中收到这些变量：

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: '1' },
  }),
});
```

可以独立于 spawn hook 禁用会话元数据：

```typescript
const powershellTool = createPowerShellTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

禁用后，Pi 会移除这些变量继承来的值，使嵌套的 Pi 进程不会暴露过期的父会话元数据。

## Pi 进程配置

这些变量由 Pi 自己读取：

| 变量                          | 说明                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `PI_CODING_AGENT_DIR`         | 覆盖配置目录；默认是 `~/.pi/agent`                                                                                             |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储；会被 `--session-dir` 覆盖                                                                                        |
| `PI_PACKAGE_DIR`              | 覆盖包目录，对 Nix/Guix store 路径有用                                                                                         |
| `PI_OFFLINE`                  | 禁用自动网络活动，包括模型目录刷新                                                                                             |
| `PI_SKIP_VERSION_CHECK`       | 禁用向 `pi.dev` 请求最新版本                                                                                                   |
| `PI_TELEMETRY`                | 覆盖安装/更新遥测和 Provider 归属 header：`1`/`true`/`yes` 或 `0`/`false`/`no`                                                 |
| `PI_CACHE_RETENTION`          | 设为 `long`，在受支持处启用延长的 Provider Prompt 缓存                                                                         |
| `PI_SHARE_VIEWER_URL`         | 覆盖 `/share` 使用的基础 URL                                                                                                   |
| `PI_RADIUS_GATEWAY`           | 覆盖 `/bug` 上传和 Radius relay 连接使用的 Radius 网关源                                                                       |
| `PI_HARDWARE_CURSOR`          | 设为 `1` 显示硬件光标；见[终端设置](terminal-setup.md)                                                                         |
| `PI_HYPERLINKS`               | 用 `1`、`0` 或 `auto` 覆盖 OSC 8 超链接检测                                                                                    |
| `PI_IMAGE_PROTOCOL`           | 用 `kitty`、`iterm2`、`none` 或 `auto` 覆盖内联图片检测                                                                        |
| `PI_TRUE_COLOR`               | 用 `1`、`0` 或 `auto` 覆盖 truecolor 检测                                                                                      |
| `PI_TUI_ESC_TIMEOUT`          | 单独的 ESC 被当作 Escape 之前的等待时长（毫秒）；SSH 下默认为 `100`，其他情况为 `10`。如果 Alt 键输入被误读为 Escape，请增大它 |
| `VISUAL`、`EDITOR`            | `externalEditor` 未设置时的外部编辑器回退                                                                                      |
| `HTTP_PROXY`、`HTTPS_PROXY`   | 出站 HTTP 请求的代理                                                                                                           |

`ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 等 Provider 凭证和云 Provider 配置列在 [Provider 认证](providers.md#use-an-api-key-from-the-environment)中。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
