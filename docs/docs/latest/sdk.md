# SDK

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/sdk) 的中文翻译。仅供学习参考。

SDK 提供对 Pi Agent 能力的编程式访问，用于嵌入其他应用、构建自定义界面或集成自动化工作流。

**示例用例**：自定义 UI 开发、将 Agent 能力集成到现有应用、创建自动化流水线、构建生成子 Agent 的自定义工具、程序化测试 Agent 行为。

## 安装

```bash
npm install @earendil-works/pi-coding-agent
```

SDK 已包含在主包中，无需单独安装。

## 快速开始

```ts
import {
  AuthStorage,
  createAgentSession,
  ModelRegistry,
  SessionManager
} from "@earendil-works/pi-coding-agent";

// 创建凭证存储
const authStorage = new AuthStorage();

// 创建模型注册表
const modelRegistry = new ModelRegistry(authStorage);

// 创建会话
const session = await createAgentSession({
  modelRegistry,
  // model, thinkingLevel, tools 等可选参数
});

// 订阅 text_delta 事件
const unsub = session.subscribe((event) => {
  if (event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

// 发送 Prompt
await session.prompt("Summarize this repository");

// 清理
unsub();
session.dispose();
```

## 核心概念

### createAgentSession()

主工厂函数，创建单个 `AgentSession`。使用 `ResourceLoader` 提供扩展、Skills、Prompt 模板、主题和上下文文件。最小用法无需参数。

### AgentSession

管理 Agent 生命周期、消息历史、模型状态、压缩和事件流。

主要方法：
- **`prompt(text, options?)`** —— 发送 Prompt 并等待完成
- **`steer(text)`** —— 在流式传输期间队列消息
- **`followUp(text)`** —— 在流式传输期间队列 follow-up
- **`subscribe(listener)`** —— 订阅事件，返回取消订阅函数
- **`setModel(model)`**、**`setThinkingLevel(level)`** —— 模型控制
- **`navigateTree(targetId, options?)`** —— 会话树内导航
- **`compact(customInstructions?)`** —— 压缩控制
- **`abort()`** —— 中断当前操作
- **`dispose()`** —— 清理

### 事件

- **`message_update`** —— 助手流式文本，子类型 `text_delta` 和 `thinking_delta`
- **`tool_execution_start`**、**`tool_execution_update`**、**`tool_execution_end`** —— 工具执行
- **`message_start`**、**`message_end`** —— 消息生命周期
- **`agent_start`**、**`agent_end`** —— Agent 生命周期
- **`turn_start`**、**`turn_end`** —— 回合生命周期

### 内置工具名

`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`

默认启用：`read`、`bash`、`edit`、`write`

### 自定义工具

```ts
import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const myTool = defineTool({
  name: "my_tool",
  description: "My custom tool",
  parameters: Type.Object({
    input: Type.String()
  }),
  execute: async (args, ctx) => {
    return { result: `Processed: ${args.input}` };
  }
});
```

## 运行模式

### InteractiveMode

完整 TUI 交互模式。使用 `createAgentSessionRuntime` 创建运行时，然后实例化 `InteractiveMode`。

### runPrintMode

单次模式：发送 Prompt，输出结果，退出。

### runRpcMode

JSON-RPC 模式用于子进程集成。或直接使用 CLI：`pi --mode rpc --no-session`。

## 主要导出

`createAgentSession`、`createAgentSessionRuntime`、`AuthStorage`、`ModelRegistry`、`DefaultResourceLoader`、`defineTool`、`SessionManager`、`SettingsManager`、工具工厂函数（`createReadTool`、`createBashTool` 等）。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
