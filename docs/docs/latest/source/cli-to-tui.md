# 从终端到 TUI：输入 `pi` 后发生了什么

这是理解 Pi 运作机制的第一道门。当你在终端输入 `pi` 并按下 Enter 时，一段链条开始运转。本文以 **Pi v0.85.1** 源码为基准。

## 全景图

```
pi hello world
  │
  ├─ 1. Shell 找到可执行文件
  │
  ├─ 2. Node.js 启动 cli.ts
  │     └─ setupCli() → main(process.argv.slice(2))
  │
  ├─ 3. main() 解析参数、组装 Runtime
  │     ├─ parseArgs()
  │     ├─ resolveAppMode() → "interactive"
  │     ├─ 创建 createRuntime 工厂（含项目信任）
  │     ├─ createAgentSessionRuntime()
  │     └─ InteractiveMode.run()
  │
  └─ 4. InteractiveMode 启动 TUI
        ├─ createInteractiveTui() → TuiMainScreen 或 TuiAltScreen
        ├─ init() 挂上文档区 / 编辑器 / footer
        └─ run() 进入“等输入 → prompt()”循环
```

两个关键边界：

1. **项目信任**发生在加载项目本地 `.pi`、扩展和资源之前。
2. **同一个 `createRuntime` 工厂**会交给 `AgentSessionRuntime`，后续 `/new`、`/resume`、`/fork` 都复用它。

## 阶段 1：CLI 入口

**文件**：`packages/coding-agent/src/cli.ts`、`packages/coding-agent/src/cli/setup.ts`

```typescript
#!/usr/bin/env node
import { setupCli } from './cli/setup.ts';
import { main } from './main.ts';

setupCli();
main(process.argv.slice(2));
```

`setupCli()` 只做启动前的进程准备：

```typescript
export function setupCli(): void {
  process.title = APP_NAME; // ps/top 里显示为 "pi"
  process.env.PI_CODING_AGENT = 'true';
  process.env.AI_AGENT = 'pi';
  configureHttpDispatcher();
}
```

`cli.ts` 本身不解析参数。参数、登录子命令、首次启动 UI 都在 `packages/coding-agent/src/cli/` 和 `main.ts`。

## 阶段 2：`main()` 参数解析与服务组装

**文件**：`packages/coding-agent/src/main.ts`、`packages/coding-agent/src/cli/args.ts`

### 2a. 参数解析

```typescript
const parsed = parseArgs(args);
```

`Args` 比早期版本更完整。和读码最相关的字段是：

```typescript
export interface Args {
  provider?: string;
  model?: string;
  apiKey?: string;
  print?: boolean;
  mode?: 'text' | 'json' | 'rpc';
  continue?: boolean;
  resume?: boolean;
  session?: string;
  noSession?: boolean;
  projectTrustOverride?: boolean; // --approve / --no-approve
  messages: string[];
  fileArgs: string[];
  unknownFlags: Map<string, boolean | string>;
  // ...
}
```

### 2b. 决定运行模式

```typescript
function resolveAppMode(parsed: Args, stdinIsTTY: boolean, stdoutIsTTY: boolean): AppMode {
  if (parsed.mode === 'rpc') return 'rpc';
  if (parsed.mode === 'json') return 'json';
  if (parsed.print || !stdinIsTTY || !stdoutIsTTY) return 'print';
  return 'interactive';
}
```

注意第三行：stdin **或** stdout 不是 TTY，都会进 print 模式。管道、重定向、CI 都走这条路。

| 模式            | 触发方式                | 用途                 |
| --------------- | ----------------------- | -------------------- |
| **interactive** | 直接 `pi`               | 日常 TUI             |
| **print**       | `pi -p "..."`，或非 TTY | 一次性输出           |
| **json**        | `pi --mode json`        | 结构化事件           |
| **rpc**         | `pi --mode rpc`         | 作为其他程序的子进程 |

### 2c. 项目信任嵌在 Runtime 工厂里

`main()` 先构造 `createRuntime`，再调用 `createAgentSessionRuntime(createRuntime, ...)`。如果当前 cwd 有需要信任的项目资源，资源加载会回调 `resolveProjectTrusted()`：

```text
createRuntime(cwd)
  → SettingsManager.create(..., { projectTrusted })
  → createAgentSessionServices()
      → ResourceLoader.reload({ resolveProjectTrust })
          → resolveProjectTrusted()
  → createAgentSessionFromServices()
```

只有项目被信任后，才会加载项目本地扩展和 `.pi` 配置。详情见 [项目信任与认证](trust-and-auth.md)。

### 2d. 服务与 Runtime

**文件**：`packages/coding-agent/src/core/agent-session-services.ts`、`agent-session-runtime.ts`

`createAgentSessionServices()` 创建的是 cwd 绑定的基础设施，还不是会话本身：

```
AgentSessionServices
  ├── cwd / agentDir
  ├── ModelRuntime      模型、认证、目录
  ├── SettingsManager   全局/项目设置
  └── ResourceLoader    扩展、Skill、prompt、主题
```

然后 `createAgentSessionFromServices()` 再把 `AgentSession` 装上去。`AgentSessionRuntime` 保存同一个工厂，会话切换时按新的 cwd 重建服务。

## 阶段 3：InteractiveMode 启动 TUI

**文件**：`packages/coding-agent/src/modes/interactive/interactive-mode.ts`、`tui-renderer.ts`

构造函数不再直接 `new TUI(new ProcessTerminal())`。它通过 `createInteractiveTui()` 选择渲染器：

```typescript
this.renderer = createInteractiveTui({
  tuiMode, // "regular" | "fullscreen"
  showHardwareCursor: this.settingsManager.getShowHardwareCursor(),
  logDirectory: getAgentDir(),
  terminal: options.terminal,
});
this.ui = createInteractiveTuiReference(() => this.renderer);
```

- `regular` → `TuiMainScreen` + `ProcessTerminal`
- `fullscreen` → `TuiAltScreen`（备用屏幕、全文搜索、跳到最新消息）

`this.ui` 是一层 Proxy。切换 regular/fullscreen 时，组件树可以继续拿同一个 `ui` 引用。

### 布局

可见区域不是一串 `ui.addChild(...)`，而是先组文档容器，再挂到 viewport：

```text
documentContainer
  ├── headerContainer
  ├── loadedResourcesContainer
  └── chatContainer

fullscreen / main screen
  ├── documentContainer
  ├── pendingMessagesContainer
  ├── statusContainer
  ├── widgetContainerAbove
  ├── editorContainer
  ├── widgetContainerBelow
  └── footerContainer
```

`init()` 里会：

1. 先 `ui.start()`，让 `session_start` 扩展能弹对话框；
2. 后台确保 `fd` / `rg` 可用（自动下载）；
3. 再打开完整快捷键和提交处理。

`ProcessTerminal` 仍然会进入 raw mode、必要时切换备用屏幕、启用 bracketed paste。这些能力在 `packages/tui/src/terminal.ts`。

## 阶段 4：主循环等待输入

```typescript
async run(): Promise<void> {
  await this.init();

  if (!process.env.PI_OFFLINE) {
    void refreshModelCatalogs(this.session.modelRuntime, ...);
  }
  checkForNewPiVersion(this.version);
  this.checkForPackageUpdates();
  this.checkTmuxKeyboardSetup();

  if (initialMessage) {
    await this.session.prompt(initialMessage, { images: initialImages });
  }

  while (true) {
    const userInput = await this.getUserInput();
    await this.session.prompt(userInput);
  }
}
```

`getUserInput()` 用 Promise 挂起。用户按 Enter 后，编辑器回调 resolve，主循环调用 `session.prompt()`。

## 关键概念

| 概念                             | 解释                            | 代码位置                   |
| -------------------------------- | ------------------------------- | -------------------------- |
| **raw mode**                     | 逐按键读取，不按行缓冲          | `terminal.ts`              |
| **差分渲染**                     | 只更新变化的行                  | `tui.ts`                   |
| **TuiMainScreen / TuiAltScreen** | 普通模式与 fullscreen           | `tui-renderer.ts`          |
| **Runtime 工厂**                 | 复用于 `/new` `/resume` `/fork` | `agent-session-runtime.ts` |
| **项目信任**                     | 加载项目资源前的确认            | `project-trust.ts`         |

## 下一步

→ [从输入到 LLM 循环](input-to-llm.md) — 用户输入文本后，消息如何到达 LLM
