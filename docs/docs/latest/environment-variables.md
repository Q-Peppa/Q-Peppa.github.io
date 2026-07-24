# Environment Variables（环境变量）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/environment-variables) 的中文翻译。仅供学习参考。

Pi 以三种方式使用环境变量：

- 诸如 `PI_OFFLINE` 等变量用于配置 Pi 进程。
- Pi 设置 `PI_CODING_AGENT`，使子进程能够检测到它们在 Pi 内部运行。
- 由 LLM 可调用的 bash 工具运行的命令会收到描述当前会话的 `PI_*` 变量。

Provider API Key 变量在 [Providers](/docs/latest/providers#environment-variables-or-auth-file) 中单独说明。

## 进程标记

CLI 和 RPC 入口点设置 `PI_CODING_AGENT=true`。子进程继承该变量，可用于检测自身在 Pi 内部运行。该变量不区分会话，且通过 SDK 嵌入 Pi 时不会自动设置。

## Bash 工具会话环境

由 bash 工具运行的命令会收到当前 Pi 会话状态：

| 变量                 | 说明                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `PI_SESSION_ID`      | 当前会话 ID                                                                            |
| `PI_SESSION_FILE`    | 当前会话 JSONL 文件的绝对路径；临时会话不设置                                          |
| `PI_PROVIDER`        | 当前选择的模型 Provider                                                                |
| `PI_MODEL`           | 当前选择的模型 ID                                                                      |
| `PI_REASONING_LEVEL` | 当前有效的 reasoning 级别：`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max` |

这些值在每条命令启动时解析。因此切换模型或更改 reasoning 级别会影响下一条 bash 命令，无需重启 Pi。`PI_PROVIDER` 和 `PI_MODEL` 标识的是 Pi 选择的模型，而非路由器内部可能选择的其他上游模型。

当被问及正在运行哪个模型或 Provider 时，应检查这些变量，而非从系统提示中推断：

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

当会话为持久化时，可直接检查会话文件：

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

这些变量被注入到 LLM 可调用的 bash 工具中。它们不会被注入到用户输入的 `!` 或 `!!` 命令中。

### 自定义 Bash 工具

使用 `createBashTool()` 创建的 bash 工具在注册到 Pi 时默认暴露会话环境。注入发生在 `spawnHook` 之前，因此 hook 可以在 `ctx.env` 中收到这些变量：

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: '1' },
  }),
});
```

独立于 spawn hook 禁用会话元数据：

```typescript
const bashTool = createBashTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

禁用后，Pi 会移除这些变量的继承值，使嵌套的 Pi 进程不会暴露过时的父会话元数据。

## Pi 进程配置

以下变量由 Pi 自身读取：

| 变量                          | 说明                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `PI_CODING_AGENT_DIR`         | 覆盖配置目录；默认为 `~/.pi/agent`                                            |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储；可被 `--session-dir` 覆盖                                       |
| `PI_PACKAGE_DIR`              | 覆盖包目录，适用于 Nix/Guix 存储路径                                          |
| `PI_OFFLINE`                  | 禁用启动网络操作，包括更新检查、包更新和安装/更新遥测                         |
| `PI_SKIP_VERSION_CHECK`       | 禁用 `pi.dev` 最新版本请求                                                    |
| `PI_TELEMETRY`                | 覆盖安装/更新遥测和 Provider 归因请求头：`1`/`true`/`yes` 或 `0`/`false`/`no` |
| `PI_CACHE_RETENTION`          | 设置为 `long` 以在支持的 Provider 上启用扩展 prompt 缓存                      |
| `PI_SHARE_VIEWER_URL`         | 覆盖 `/share` 使用的基础 URL                                                  |
| `PI_HARDWARE_CURSOR`          | 设置为 `1` 以显示硬件光标；参见 [Terminal setup](/docs/latest/terminal-setup) |
| `VISUAL`、`EDITOR`            | 当 `externalEditor` 未设置时的外部编辑器回退                                  |
| `HTTP_PROXY`、`HTTPS_PROXY`   | 代理出站 HTTP 请求                                                            |

Provider 凭据（如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 以及云 Provider 配置）在 [Providers](/docs/latest/providers#environment-variables-or-auth-file) 中列出。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
