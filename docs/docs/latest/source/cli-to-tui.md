# 从终端到 TUI：输入 `pi` 后发生了什么

这是理解 Pi 运作机制的**第一道门**。当你在终端输入 `pi` 并按下 Enter 时，一段精密的链条开始运转。本文以 **Pi v0.80.10** 源码为基准。

## 全景图

```
pi hello world
  │
  ├─ 1. Shell 解析命令，查找可执行文件
  │     └─ 找到全局安装的 pi-coding-agent
  │
  ├─ 2. Node.js 启动 cli.ts
  │     ├─ shebang 指定 node
  │     ├─ process.title = "pi"（设置进程名）
  │     └─ main(process.argv.slice(2))（启动主流程）
  │
  ├─ 3. main() 解析参数、组装服务
  │     ├─ parseArgs(args)（解析 CLI 参数）
  │     ├─ resolveAppMode() → "interactive"
  │     ├─ 项目信任决策（project trust）
  │     ├─ createAgentSessionServices()（创建服务）
  │     ├─ createAgentSessionRuntime()（组装 runtime）
  │     └─ InteractiveMode.run()（启动 TUI）
  │
  └─ 4. InteractiveMode 启动 TUI
        ├─ new TUI(new ProcessTerminal())（创建 TUI 实例）
        ├─ init()（构建 UI 布局）
        └─ run()（进入主循环）
```

当前主流程的两个关键边界是**项目信任（project trust）**和 **Runtime 工厂**：同一个 `createRuntime` 工厂会被复用于 `/new`、`/resume`、`/fork` 等会话切换场景；模型与认证则由 `ModelRuntime` 统一提供。

## 详细拆解

### 阶段 1：CLI 入口（`cli.ts`）

**文件**：`packages/coding-agent/src/cli.ts`

```typescript
#!/usr/bin/env node
import { main } from './main.ts';

process.title = APP_NAME; // 在 ps/top 中显示为 "pi"
process.env.PI_CODING_AGENT = 'true'; // 标记这是 coding-agent 进程
configureHttpDispatcher(); // 配置 HTTP 请求池

main(process.argv.slice(2)); // 传入去掉 node/cli 的参数
```

这个文件只做三件事：

1. **设置进程名** — 让你在 `ps aux | grep pi` 中能看到
2. **标记环境变量** — 子进程（bash 工具）可以检测自己是否在 Pi 中运行
3. **启动主流程** — `cli.ts` 本身不做事，只负责启动 `main()`

### 阶段 2：`main()` 参数解析与服务组装

**文件**：`packages/coding-agent/src/main.ts`

#### 2a. 参数解析

```typescript
const parsed = parseArgs(args);
```

`parseArgs()` 将所有 CLI 参数解析为一个 `Args` 对象：

```typescript
interface Args {
  model?: string; // --model 或 --provider + --model
  thinking?: string; // --thinking level
  session?: string; // --session <path|id>
  continue?: boolean; // -c 继续最近会话
  resume?: boolean; // -r 浏览选择历史会话
  noSession?: boolean; // --no-session 不持久化
  help?: boolean; // --help
  version?: boolean; // --version
  print?: boolean; // -p "prompt" 非交互模式
  mode?: 'rpc' | 'json'; // --mode
  verbose?: boolean; // --verbose
  apiKey?: string; // --api-key（runtime 覆盖）
  // ... 更多
}
```

#### 2b. 决定运行模式

```typescript
let appMode = resolveAppMode(parsed, process.stdin.isTTY);
```

`resolveAppMode()` 的逻辑：

```typescript
function resolveAppMode(parsed: Args, stdinIsTTY: boolean): AppMode {
  if (parsed.mode === 'rpc') return 'rpc'; // RPC 模式（进程集成）
  if (parsed.mode === 'json') return 'json'; // JSON 事件流模式
  if (parsed.print || !stdinIsTTY) return 'print'; // 一次性输出（-p 或管道输入）
  return 'interactive'; // 默认交互模式
}
```

四种模式的区别：

| 模式            | 触发方式         | 用途                 |
| --------------- | ---------------- | -------------------- |
| **interactive** | 直接 `pi`        | 日常使用，TUI 界面   |
| **print**       | `pi -p "prompt"` | 一次性问答，适合脚本 |
| **json**        | `pi --mode json` | 输出结构化 JSON 事件 |
| **rpc**         | `pi --mode rpc`  | 作为其他程序的子进程 |

#### 2c. 项目信任

在加载项目本地 `.pi` 目录、扩展、资源之前，`main()` 会调用 `resolveProjectTrusted()`：

```
项目信任决策
  ├── 检查 trust store（~/.pi/agent/trust.json）是否已记录该 cwd 的信任决策
  ├── 如果没有，检查是否有需要信任的项目资源（.pi、AGENTS.md、.agents/skills 等）
  ├── 触发 project_trust 扩展事件（仅限 user/global/CLI 扩展）
  └── 必要时弹出 TUI 选择器询问用户
```

只有项目被信任后，才会继续加载项目本地扩展和 `.pi` 配置。详见 [项目信任与认证体系](trust-and-auth.md)。

#### 2d. 创建服务（`createAgentSessionServices`）

**文件**：`packages/coding-agent/src/core/agent-session-services.ts`

```typescript
const services = await createAgentSessionServices({
  agentDir,
  cwd,
  settingsManager,
  modelRuntime,
  // ...
});
```

这里创建并连接所有核心服务：

```
┌─────────────────────────────────────────────┐
│          AgentSessionServices               │
│                                             │
│  ┌────────────────┐  ┌───────────────────┐  │
│  │ SettingsManager│  │ ModelRuntime      │  │
│  │ (全局/项目设置) │  │ (模型/认证/刷新)  │  │
│  ├────────────────┤  ├───────────────────┤  │
│  │ ResourceLoader  │  │ Diagnostics       │  │
│  │ (扩展/Skill/提示词)│ (诊断信息)       │  │
│  └────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────┘
```

#### 2e. 创建 Runtime（`createAgentSessionRuntime`）

**文件**：`packages/coding-agent/src/core/agent-session-runtime.ts`

`main()` 构造一个 `createRuntime` 工厂函数，然后传给 `createAgentSessionRuntime()`：

```typescript
const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: sessionManager.getCwd(),
  agentDir,
  sessionManager,
});
```

关键设计：**同一个 `createRuntime` 工厂会被保存到 `AgentSessionRuntime` 中**，后续 `/new`、`/resume`、`/fork`、导入会话时都会复用它重新创建服务与 session。

```typescript
export async function createAgentSessionRuntime(
  createRuntime: CreateAgentSessionRuntimeFactory,
  options: { cwd: string; agentDir: string; sessionManager: SessionManager; sessionStartEvent?: SessionStartEvent },
): Promise<AgentSessionRuntime> {
  const result = await createRuntime(options);
  return new AgentSessionRuntime(
    result.session,
    result.services,
    createRuntime,
    result.diagnostics,
    result.modelFallbackMessage,
  );
}
```

### 阶段 3：InteractiveMode 启动 TUI

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`

#### 3a. 构造函数

```typescript
this.ui = new TUI(new ProcessTerminal(), settingsManager.getShowHardwareCursor());
```

`ProcessTerminal` 接管终端：

```
ProcessTerminal 初始化
  → process.stdin.setRawMode(true)     // 进入 raw mode：逐按键读取
  → process.stdin.resume()             // 恢复 stdin 流
  → write("\x1b[?1049h")              // 切换到备用屏幕缓冲区
  → write("\x1b[?25l")                // 隐藏光标
  → write("\x1b[?2004h")              // 启用 bracketed paste
```

**raw mode** 是终端编程的核心：正常模式下终端按行缓冲，raw mode 下每个按键立即发送，TUI 才能实时响应。

#### 3b. `init()` 构建 UI 布局

```typescript
async init(): Promise<void> {
  this.registerSignalHandlers();

  // 确保 fd 和 rg 工具可用（自动下载）
  const [fdPath] = await Promise.all([ensureTool("fd"), ensureTool("rg")]);

  // 从顶到底构建布局
  this.ui.addChild(this.headerContainer);
  this.ui.addChild(this.chatContainer);
  this.ui.addChild(this.pendingMessagesContainer);
  this.ui.addChild(this.statusContainer);
  this.ui.addChild(this.widgetContainerAbove);
  this.ui.addChild(this.editorContainer);
  this.ui.addChild(this.widgetContainerBelow);
  this.ui.addChild(this.footer);

  this.ui.setFocus(this.editor);
  this.setupKeyHandlers();
  this.setupEditorSubmitHandler();

  this.ui.start(); // 启动 TUI 渲染循环
}
```

#### 3c. `ui.start()` 启动渲染循环

**文件**：`packages/tui/src/tui.ts`

```typescript
private handleInput(data: string): void {
  // 处理 OSC 11 终端背景色回复、颜色方案变化等
  if (this.consumeOsc11BackgroundResponse(data)) return;
  if (this.consumeTerminalColorSchemeReport(data)) return;

  // 分发给 input listener
  for (const listener of this.inputListeners) {
    const result = listener(current);
    if (result?.consumed) return;
  }

  // 分发给聚焦组件
  this.focusedComponent?.handleInput?.(data);
}
```

渲染循环：

```typescript
private scheduleRender(): void {
  const elapsed = performance.now() - this.lastRenderAt;
  const delay = Math.max(0, TUI.MIN_RENDER_INTERVAL_MS - elapsed);
  this.renderTimer = setTimeout(() => {
    this.doRender();
  }, delay);
}
```

**差分渲染**：每帧收集所有组件的 `render(width)` 输出，与上一帧对比，只输出变化的行。

### 阶段 4：主循环等待输入

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`

```typescript
async run(): Promise<void> {
  await this.init();

  // 异步后台任务
  checkForNewPiVersion(this.version);
  this.checkForPackageUpdates();
  this.checkTmuxKeyboardSetup();

  if (initialMessage) {
    await this.session.prompt(initialMessage);
  }

  // ★ 主循环
  while (true) {
    const userInput = await this.getUserInput();
    try {
      await this.session.prompt(userInput);
    } catch (error) {
      this.showError(errorMessage);
    }
  }
}
```

`getUserInput()` 用一个 Promise 挂起等待编辑器回调：

```typescript
async getUserInput(): Promise<string> {
  return new Promise((resolve) => {
    this.onInputCallback = (text: string) => {
      this.onInputCallback = undefined;
      resolve(text);
    };
  });
}
```

当用户按 Enter 时，编辑器调用回调，主循环继续，调用 `session.prompt(userInput)`。

### 完整流程图

```
┌──────────────────────────────────────────────┐
│ 终端 (shell)                                  │
│   $ pi hello world                            │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ cli.ts                                         │
│   main(process.argv.slice(2))                  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ main.ts                                        │
│   parseArgs() → ["hello", "world"]             │
│   resolveAppMode() → "interactive"             │
│   resolveProjectTrusted() → 项目信任           │
│   createAgentSessionServices() → 服务          │
│   createAgentSessionRuntime() → Runtime        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ InteractiveMode                                │
│   new TUI(new ProcessTerminal())               │
│   init() → header/chat/editor/footer           │
│   ui.start() → raw mode + 差分渲染循环          │
│   run() → while(true) { getUserInput(); prompt() }
└──────────────────────────────────────────────┘
```

## 关键概念总结

| 概念                | 解释                            | 代码位置                                |
| ------------------- | ------------------------------- | --------------------------------------- |
| **raw mode**        | 终端逐按键读取，不按行缓冲      | `terminal.ts`                           |
| **差分渲染**        | 只更新变化的行，减少闪烁        | `tui.ts`                                |
| **备用屏幕**        | 退出 Pi 后恢复原终端内容        | `terminal.ts`                           |
| **bracketed paste** | 区分键盘输入和粘贴内容          | `terminal.ts`                           |
| **Component 接口**  | 所有 UI 组件的基类              | `tui.ts`                                |
| **Runtime 工厂**    | 复用于 `/new` `/resume` `/fork` | `agent-session-runtime.ts`              |
| **项目信任**        | 加载项目资源前的用户确认        | `project-trust.ts` / `trust-manager.ts` |

## 下一步

→ [从输入到 LLM 循环](input-to-llm.md) — 用户输入文本后，消息如何到达 LLM，工具如何执行
