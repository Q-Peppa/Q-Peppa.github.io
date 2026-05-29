# 从终端到 TUI：输入 `pi` 后发生了什么

这是理解 Pi 运作机制的**第一道门**。当你在终端输入 `pi` 并按下 Enter 时，一段精密的链条开始运转。

## 全景图

```
pi hello world
  │
  ├─ 1. Shell 解析命令，查找可执行文件
  │     └─ 找到全局安装的 pi-coding-agent
  │
  ├─ 2. Node.js 启动 cli.ts
  │     ├─ packages/coding-agent/src/cli.ts:1    # shebang 指定 node
  │     ├─ packages/coding-agent/src/cli.ts:11   # process.title = "pi"
  │     └─ packages/coding-agent/src/cli.ts:17   # main(process.argv.slice(2))
  │
  ├─ 3. main() 解析参数、组装服务
  │     ├─ packages/coding-agent/src/main.ts:288 # parseArgs(args)
  │     ├─ packages/coding-agent/src/main.ts:298 # resolveAppMode() → "interactive"
  │     ├─ packages/coding-agent/src/main.ts:359 # createSessionManager()
  │     ├─ packages/coding-agent/src/main.ts:408 # createAgentSessionRuntime()
  │     └─ packages/coding-agent/src/main.ts:540 # InteractiveMode.run()
  │
  └─ 4. InteractiveMode 启动 TUI
        ├─ interactive-mode.ts:396               # new TUI(new ProcessTerminal())
        ├─ interactive-mode.ts:4130              # init() 构建 UI 布局
        └─ interactive-mode.ts:1000              # run() 进入主循环
```

## 详细拆解

### 阶段 1：CLI 入口（`cli.ts`）

**文件**：`packages/coding-agent/src/cli.ts`（全文件 18 行）

```typescript
#!/usr/bin/env node
import { main } from "./main.ts";

process.title = APP_NAME;                // 第 11 行：在 ps/top 中显示为 "pi"
process.env.PI_CODING_AGENT = "true";     // 第 12 行：标记这是 coding-agent 进程
configureHttpDispatcher();                // 第 16 行：配置 HTTP 请求池

main(process.argv.slice(2));              // 第 17 行：传入去掉 node/cli 的参数
```

这个文件只有 18 行，但做了三件重要的事：
1. **设置进程名** — 让你在 `ps aux | grep pi` 中能看到
2. **标记环境变量** — 子进程（bash 工具）可以检测自己是否在 Pi 中运行
3. **启动主流程** — `cli.ts` 本身不做事，只负责启动 `main()`

### 阶段 2：`main()` 参数解析与服务组装

**文件**：`packages/coding-agent/src/main.ts`
**关键行数**：`main()` 函数从第 280 行开始

#### 2a. 参数解析

```typescript
// main.ts:288
const parsed = parseArgs(args);
```

`parseArgs()` 将所有 CLI 参数解析为一个 `Args` 对象：

```typescript
interface Args {
  model?: string;        // --model 或 --provider + --model
  thinking?: string;     // --thinking level
  session?: string;      // --session <path|id>
  continue?: boolean;    // -c 继续最近会话
  resume?: boolean;      // -r 浏览选择历史会话
  noSession?: boolean;   // --no-session 不持久化
  help?: boolean;        // --help
  version?: boolean;     // --version
  print?: boolean;       // -p "prompt" 非交互模式
  mode?: "rpc" | "json"; // --mode
  verbose?: boolean;     // --verbose
  // ... 更多
}
```

#### 2b. 决定运行模式

```typescript
// main.ts:298
let appMode = resolveAppMode(parsed, process.stdin.isTTY);
```

`resolveAppMode()` 的逻辑（`main.ts:85-95`）：

```typescript
function resolveAppMode(parsed: Args, stdinIsTTY: boolean): AppMode {
  if (parsed.mode === "rpc")    return "rpc";       // RPC 模式（进程集成）
  if (parsed.mode === "json")   return "json";      // JSON 事件流模式
  if (parsed.print || !stdinIsTTY) return "print";  // 一次性输出（-p 或管道输入）
  return "interactive";                             // 默认交互模式
}
```

四种模式的区别：

| 模式 | 触发方式 | 用途 |
|------|---------|------|
| **interactive** | 直接 `pi` | 日常使用，TUI 界面 |
| **print** | `pi -p "prompt"` | 一次性问答，适合脚本 |
| **json** | `pi --mode json` | 输出结构化 JSON 事件 |
| **rpc** | `pi --mode rpc` | 作为其他程序的子进程 |

#### 2c. 创建 SessionManager

```typescript
// main.ts:359
let sessionManager = await createSessionManager(parsed, cwd, sessionDir, startupSettingsManager);
```

SessionManager 负责**会话的持久化和生命周期**。根据参数不同：

```
pi                     → SessionManager.create()     创建新会话
pi -c                  → SessionManager.continueRecent() 继续最近会话
pi -r                  → 显示选择器 → SessionManager.open() 打开选中会话
pi --session abc.json  → SessionManager.open("abc.json") 打开指定会话
pi --fork abc.json    → SessionManager.forkFrom()   从现有会话创建分支
```

每个会话是一个 **JSONL 文件**（每行一条 JSON 消息），保存在项目目录中。

#### 2d. 创建 AgentSessionRuntime

```typescript
// main.ts:408
const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: sessionManager.getCwd(),
  agentDir,
  sessionManager,
});
```

`createAgentSessionRuntime()` 是**服务组装的核心**。它创建并连接所有服务：

```
┌──────────────────────────────────────────┐
│       AgentSessionRuntime                │
│                                          │
│  ┌────────────┐  ┌────────────────────┐  │
│  │ AgentSession│──│ SettingsManager    │  │
│  │            │  │ (设置/配置)          │  │
│  ├────────────┤  ├────────────────────┤  │
│  │ Agent       │  │ ModelRegistry      │  │
│  │ (agent-core)│  │ (模型元数据)        │  │
│  ├────────────┤  ├────────────────────┤  │
│  │ ResourceLoader│ │ AuthStorage       │  │
│  │ (扩展/skills)│ │ (认证信息)          │  │
│  ├────────────┤  ├────────────────────┤  │
│  │ ExtensionRunner│ │ ToolRegistry     │  │
│  │ (事件分发)   │  │ (工具注册)         │  │
│  └────────────┘  └────────────────────┘  │
└──────────────────────────────────────────┘
```

### 阶段 3：InteractiveMode 启动 TUI

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`

#### 3a. 构造函数（约第 370 行）

```typescript
// interactive-mode.ts:370
this.ui = new TUI(new ProcessTerminal(), settingsManager.getShowHardwareCursor());
```

**这里发生了关键的事**：`ProcessTerminal` 接管了终端。

```
ProcessTerminal 初始化
  → process.stdin.setRawMode(true)     // 进入 raw mode：逐按键读取
  → process.stdin.resume()             // 恢复 stdin 流
  → write("\x1b[?1049h")              // 切换到备用屏幕缓冲区
  → write("\x1b[?25l")                // 隐藏光标
  → write("\x1b[?2004h")              // 启用 bracketed paste
```

**raw mode 是终端编程的核心概念**。正常模式下，终端按行缓冲（你按 Enter 才发送数据）。raw mode 下，**每个按键立即发送**。这是 TUI 能实时响应的基础。

#### 3b. `init()` 构建 UI 布局（约第 988 行）

```typescript
// interactive-mode.ts:988
async init(): Promise<void> {
  // 1. 注册信号处理（Ctrl+C, SIGTERM）
  this.registerSignalHandlers();

  // 2. 确保 fd 和 rg 工具可用（自动下载）
  const [fdPath] = await Promise.all([ensureTool("fd"), ensureTool("rg")]);

  // 3. 构建 UI 布局（从顶到底）
  this.ui.addChild(this.headerContainer);     // Logo + 快捷键提示
  this.ui.addChild(this.chatContainer);       // 聊天消息区域
  this.ui.addChild(this.pendingMessagesContainer); // 排队的消息
  this.ui.addChild(this.statusContainer);     // 状态栏（"Working..."）
  this.ui.addChild(this.widgetContainerAbove);// 扩展组件（上方）
  this.ui.addChild(this.editorContainer);     // ★ 编辑器
  this.ui.addChild(this.widgetContainerBelow);// 扩展组件（下方）
  this.ui.addChild(this.footer);              // 底部状态栏

  // 4. 设置编辑器为焦点组件
  this.ui.setFocus(this.editor);

  // 5. 注册按键处理
  this.setupKeyHandlers();
  this.setupEditorSubmitHandler();

  // 6. ★ 启动 TUI 渲染循环
  this.ui.start();
}
```

#### 3c. `ui.start()` 启动渲染循环

**文件**：`packages/tui/src/tui.ts`
**关键方法**：`start()`（约第 320 行附近）

```typescript
// tui.ts: start() 方法的核心逻辑
start(): void {
  // 设置 stdin 监听
  this.terminal.onInput((data) => {
    // 解码按键事件
    const key = parseKey(data);
    // 分发给聚焦组件
    this.focusedComponent?.handleInput(data);
  });

  // 启动渲染循环
  this._startRenderLoop();
}

private _startRenderLoop(): void {
  const loop = () => {
    // 收集所有组件的渲染输出
    const lines = this._renderAll();
    // 差分渲染：只输出变化的行
    this._differentialRender(lines);
    // 下一帧（使用 setImmediate 或 setTimeout）
    this._renderTimer = setTimeout(loop, this._frameInterval);
  };
  loop();
}
```

**差分渲染**是 Pi TUI 的核心性能优化：
1. 每帧渲染时，先收集所有组件的 `render(width)` 输出
2. 与上一帧的输出对比，**只输出变化的行**
3. 使用 ANSI 转义码定位光标、清除行、写入新内容

#### 3d. 启动帮助信息

TUI 启动后，你会看到：

```
pi v1.0.0
Ctrl+C 中断 · Ctrl+D 退出 · / 命令 · ! bash

按 Tab 展开完整帮助和已加载资源。

Pi 可以解释自身功能并查阅文档。询问如何使用或扩展 Pi。

╭──────────────────────────────────────────────────╮
│                                                  │
│  > _                                              │
│                                                  │
╰──────────────────────────────────────────────────╯

 Ctrl+L 模型  Ctrl+P 循环  Tab 补全  / 命令
```

### 阶段 4：主循环等待输入

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`
**关键方法**：`run()`（约第 1000 行）

```typescript
// interactive-mode.ts:1000
async run(): Promise<void> {
  await this.init();  // 初始化 UI

  // 异步后台任务（不阻塞主循环）
  checkForNewPiVersion(this.version);       // 版本检查
  this.checkForPackageUpdates();            // 包更新检查
  this.checkTmuxKeyboardSetup();            // tmux 键盘检查

  // 处理初始消息（如果通过 CLI 传入了 prompt）
  if (initialMessage) {
    await this.session.prompt(initialMessage);
  }

  // ★ 主循环
  while (true) {
    const userInput = await this.getUserInput();  // 等待用户输入
    try {
      await this.session.prompt(userInput);        // 发送到 Agent
    } catch (error) {
      this.showError(errorMessage);
    }
  }
}
```

`getUserInput()` 的实现很简单，但背后是复杂的 TUI 交互：

```typescript
// interactive-mode.ts:3233
async getUserInput(): Promise<string> {
  return new Promise((resolve) => {
    this.onInputCallback = (text: string) => {
      this.onInputCallback = undefined;
      resolve(text);
    };
  });
}
```

当用户在编辑器中输入文本并按 Enter 时：
1. 编辑器组件的 `handleInput()` 检测到 Enter 键
2. 编辑器调用 `this.onInputCallback(text)`
3. Promise 解析，`getUserInput()` 返回
4. 主循环继续，调用 `session.prompt(userInput)`

### 完整流程图

```
┌─────────────────────────────────────────────────┐
│ 终端 (shell)                                     │
│   $ pi hello world                              │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ cli.ts (第 17 行)                                │
│   main(process.argv.slice(2))                   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ main.ts (第 280 行起)                            │
│   parseArgs() → ["hello", "world"]              │
│   resolveAppMode() → "interactive"              │
│   createSessionManager() → 新建会话              │
│   createAgentSessionRuntime() → 组装所有服务     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ InteractiveMode (interactive-mode.ts)            │
│                                                  │
│   构造函数: new TUI(new ProcessTerminal())       │
│   init():                                      │
│     ├── header (logo + 快捷键提示)               │
│     ├── chatContainer (聊天消息)                 │
│     ├── editor (编辑器 ← 焦点)                   │
│     └── footer (状态栏)                          │
│                                                  │
│   ui.start():                                  │
│     ├── stdin raw mode → 逐按键读取              │
│     ├── 渲染循环启动 → 差分渲染                  │
│     └── 按键事件分发到编辑器                     │
│                                                  │
│   run():                                       │
│     └── while(true) {                           │
│           userInput = await getUserInput()      │
│           await session.prompt(userInput)       │
│         }                                       │
└─────────────────────────────────────────────────┘
```

### 关键概念总结

| 概念 | 解释 | 代码位置 |
|------|------|---------|
| **raw mode** | 终端逐按键读取，不按行缓冲 | `terminal.ts` |
| **差分渲染** | 只更新变化的行，减少闪烁 | `tui.ts:_startRenderLoop()` |
| **备用屏幕** | 退出 Pi 后恢复原终端内容 | `terminal.ts` |
| **bracketed paste** | 区分键盘输入和粘贴内容 | `terminal.ts` |
| **Component 接口** | 所有 UI 组件的基类 | `tui.ts:Component` |
| **主循环** | `while(true) { getInput → prompt }` | `interactive-mode.ts:run()` |

## 下一步

→ [从输入到 LLM 循环](input-to-llm.md) — 用户输入文本后，消息如何到达 LLM，工具如何执行
