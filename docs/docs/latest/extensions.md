# Extensions（扩展）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/extensions) 的中文翻译。仅供学习参考。

Extensions 是 TypeScript 模块，用于扩展 Pi 的行为。扩展可以订阅生命周期事件、注册 LLM 可调用的自定义工具、添加命令等。

**核心能力**：自定义工具、事件拦截、通过 `ctx.ui` 进行用户交互、自定义 TUI 组件、自定义命令、会话持久化和自定义渲染。

**示例用例**：权限门控（确认后执行危险命令）、Git 检查点、路径保护、自定义压缩、对话摘要、交互式工具、有状态工具、外部集成。

## 快速开始

创建文件 `~/.pi/agent/extensions/my-extension.ts`，导出一个接收 `ExtensionAPI` 的默认函数：

```ts
export default function (pi: ExtensionAPI) {
  pi.on("session_start", (event, ctx) => {
    // 会话启动时的逻辑
  });
}
```

使用 `pi -e ./my-extension.ts` 测试。

## 扩展位置

扩展自动从以下位置发现：

- `~/.pi/agent/extensions/*.ts` —— 全局
- `~/.pi/agent/extensions/*/index.ts` —— 全局（子目录）
- `.pi/extensions/*.ts` —— 项目本地
- `.pi/extensions/*/index.ts` —— 项目本地（子目录）
- 通过 `settings.json` 中的 `"packages"` 和 `"extensions"` 键添加的路径

## 可用导入

- `@earendil-works/pi-coding-agent` —— 类型（`ExtensionAPI`、`ExtensionContext`、事件）
- `typebox` —— 工具参数的模式定义
- `@earendil-works/pi-ai` —— AI 工具如 `StringEnum`
- `@earendil-works/pi-tui` —— 自定义渲染的 TUI 组件

## 事件

### 生命周期概览

startup → `session_start` → `resources_discover` → 用户 Prompt → `input` → `before_agent_start` → `agent_start` → turns（每个 turn 包含 `turn_start`、`context`、`before_provider_request`、`after_provider_response`、工具事件）→ `turn_end` → `agent_end`

### 资源事件

**`resources_discover`** —— 在 `session_start` 后触发，扩展可以贡献 Skill、Prompt 和主题路径。

### 会话事件

- `session_start` —— 会话启动、加载或重新加载
- `session_before_switch` —— `/new` 或 `/resume` 前
- `session_before_fork` —— `/fork` 或 `/clone` 前
- `session_before_compact` / `session_compact` —— 压缩时
- `session_before_tree` / `session_tree` —— `/tree` 导航时
- `session_shutdown` —— 扩展运行时销毁前

### Agent 事件

- `before_agent_start` —— 用户提交 Prompt 后，Agent 循环前
- `agent_start` / `agent_end` —— 每个用户 Prompt 一次
- `turn_start` / `turn_end` —— 每个 LLM 响应 + 工具调用回合
- `message_start` / `message_update` / `message_end` —— 消息生命周期
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end` —— 工具执行生命周期
- `context` —— 每次 LLM 调用前，可修改消息的深拷贝
- `before_provider_request` —— Provider 负载构建后，发送前
- `after_provider_response` —— HTTP 响应收到后，流消费前

### 工具事件

- `tool_call` —— `tool_execution_start` 后，工具执行前。**可以阻止。** `event.input` 可变——直接修改以在工具执行前修补参数。
- `tool_result` —— 工具执行后，`tool_execution_end` 前。可修改结果。

## ExtensionContext

所有处理器接收 `ctx: ExtensionContext`：

- `ctx.ui` —— 用户交互的 UI 方法
- `ctx.hasUI` —— 打印模式和 JSON 模式为 false
- `ctx.cwd` —— 当前工作目录
- `ctx.sessionManager` —— 会话状态只读访问
- `ctx.modelRegistry` / `ctx.model` —— 模型和 API Key 访问
- `ctx.signal` —— 当前 Agent 中断信号
- `ctx.isIdle()` / `ctx.abort()` / `ctx.hasPendingMessages()` —— 控制流助手
- `ctx.shutdown()` —— 请求优雅关闭
- `ctx.getContextUsage()` —— 返回当前活跃模型的上下文使用情况
- `ctx.compact(options)` —— 触压缩而不等待完成

## ExtensionAPI 方法

- `pi.on(event, handler)` —— 订阅事件
- `pi.registerTool(definition)` —— 注册自定义工具
- `pi.sendMessage(message, options?)` —— 注入自定义消息
- `pi.registerCommand(name, options)` —— 注册命令
- `pi.registerShortcut(shortcut, options)` —— 注册键盘快捷键
- `pi.registerFlag(name, options)` —— 注册 CLI 标志
- `pi.exec(command, args, options?)` —— 执行 Shell 命令
- `pi.registerProvider(name, config)` —— 注册/覆盖模型 Provider
- `pi.events` —— 扩展间通信的共享事件总线

## 自定义工具

通过 `pi.registerTool()` 注册，包含 `name`、`label`、`description`、`promptSnippet`、`promptGuidelines`、`parameters`（使用 TypeBox）和 `execute` 函数。

工具输出限制：默认 50KB 和 2000 行。

## 自定义 UI

扩展通过 `ctx.ui` 方法与用户交互：

- **对话框**：`select()`、`confirm()`、`input()`、`editor()`、`notify()`
- **状态和底部栏**：`setStatus()`、`setWorkingMessage()`、`setWidget()`、`setFooter()`、`setTitle()`
- **编辑器**：`setEditorText()`、`getEditorText()`、`pasteToEditor()`

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
