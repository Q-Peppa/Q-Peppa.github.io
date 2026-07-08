# SDK

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/sdk) 的中文翻译。仅供学习参考。

> pi 可以帮助你使用 SDK。让它为你的用例构建集成。

SDK 提供对 pi Agent 能力的编程式访问。用于嵌入其他应用、构建自定义界面或集成自动化工作流。

**示例用例：**

- 构建自定义 UI（Web、桌面、移动端）
- 将 Agent 能力集成到现有应用
- 创建带有 Agent 推理的自动化流水线
- 构建生成子 Agent 的自定义工具
- 程序化测试 Agent 行为

参见 [examples/sdk/](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/) 获取从最小到完全控制的工作示例。

## 快速开始

```typescript
import { AuthStorage, createAgentSession, ModelRegistry, SessionManager } from '@earendil-works/pi-coding-agent';

// 设置凭证存储和模型注册表
const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage,
  modelRegistry,
});

session.subscribe((event) => {
  if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt('What files are in the current directory?');
```

## 安装

```bash
npm install @earendil-works/pi-coding-agent
```

SDK 已包含在主包中，无需单独安装。

## 核心概念

### createAgentSession()

主工厂函数，创建单个 `AgentSession`。

`createAgentSession()` 使用 `ResourceLoader` 提供扩展、Skills、Prompt 模板、主题和上下文文件。如果不提供，它将使用 `DefaultResourceLoader` 进行标准发现。

```typescript
import { createAgentSession, SessionManager } from '@earendil-works/pi-coding-agent';

// 最小用法：默认使用 DefaultResourceLoader
const { session } = await createAgentSession();

// 自定义：覆盖特定选项
const { session } = await createAgentSession({
  model: myModel,
  tools: ['read', 'bash'],
  sessionManager: SessionManager.inMemory(),
});
```

### AgentSession

会话管理 Agent 生命周期、消息历史、模型状态、压缩和事件流。

```typescript
interface AgentSession {
  // 发送 Prompt 并等待完成
  prompt(text: string, options?: PromptOptions): Promise<void>;

  // 在流式传输期间队列消息
  steer(text: string): Promise<void>;
  followUp(text: string): Promise<void>;

  // 订阅事件（返回取消订阅函数）
  subscribe(listener: (event: AgentSessionEvent) => void): () => void;

  // 会话信息
  sessionFile: string | undefined;
  sessionId: string;

  // 模型控制
  setModel(model: Model): Promise<void>;
  setThinkingLevel(level: ThinkingLevel): void;
  cycleModel(): Promise<ModelCycleResult | undefined>;
  cycleThinkingLevel(): ThinkingLevel | undefined;

  // 状态访问
  agent: Agent;
  model: Model | undefined;
  thinkingLevel: ThinkingLevel;
  messages: AgentMessage[];
  isStreaming: boolean;

  // 在会话文件内进行原地树导航
  navigateTree(
    targetId: string,
    options?: { summarize?: boolean; customInstructions?: string; replaceInstructions?: boolean; label?: string },
  ): Promise<{ editorText?: string; cancelled: boolean }>;

  // 压缩
  compact(customInstructions?: string): Promise<CompactionResult>;
  abortCompaction(): void;

  // 中断当前操作
  abort(): Promise<void>;

  // 清理
  dispose(): void;
}
```

会话替换 API（如 new-session、resume、fork 和 import）位于 `AgentSessionRuntime` 上，而非 `AgentSession`。

### createAgentSessionRuntime() 和 AgentSessionRuntime

当你需要替换当前会话并重建绑定 cwd 的运行时状态时，使用运行时 API。
这是内置的交互式、打印和 RPC 模式使用的同一层。

`createAgentSessionRuntime()` 接受一个运行时工厂以及初始的 cwd/会话目标。工厂闭包捕获进程全局固定输入，为有效 cwd 重新创建绑定 cwd 的服务，针对这些服务解析会话选项，并返回完整的运行时结果。

```typescript
import {
  type CreateAgentSessionRuntimeFactory,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  SessionManager,
} from '@earendil-works/pi-coding-agent';

const createRuntime: CreateAgentSessionRuntimeFactory = async ({ cwd, sessionManager, sessionStartEvent }) => {
  const services = await createAgentSessionServices({ cwd });
  return {
    ...(await createAgentSessionFromServices({
      services,
      sessionManager,
      sessionStartEvent,
    })),
    services,
    diagnostics: services.diagnostics,
  };
};

const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  sessionManager: SessionManager.create(process.cwd()),
});
```

`AgentSessionRuntime` 负责在以下操作间替换当前运行时：

- `newSession()`
- `switchSession()`
- `fork()`
- 通过 `fork(entryId, { position: "at" })` 的克隆流程
- `importFromJsonl()`

重要行为：

- `runtime.session` 在这些操作后会变化
- 事件订阅绑定到特定的 `AgentSession`，因此替换后需要重新订阅
- 如果使用扩展，对新会话再次调用 `runtime.session.bindExtensions(...)`
- 创建时返回 `runtime.diagnostics` 上的诊断信息
- 如果运行时创建或替换失败，方法会抛出异常，由调用方决定如何处理

```typescript
let session = runtime.session;
let unsubscribe = session.subscribe(() => {});

await runtime.newSession();

unsubscribe();
session = runtime.session;
unsubscribe = session.subscribe(() => {});
```

### Prompt 和消息队列

`PromptOptions` 控制 prompt 扩展、流式期间的队列行为以及 prompt 预检通知：

```typescript
interface PromptOptions {
  expandPromptTemplates?: boolean;
  images?: ImageContent[];
  streamingBehavior?: 'steer' | 'followUp';
  source?: InputSource;
  preflightResult?: (success: boolean) => void;
}
```

`preflightResult` 在每次 `prompt()` 调用时被调用一次：

- `true` —— prompt 被接受、排队或立即处理
- `false` —— prompt 预检在接受前拒绝

它在 `prompt()` 解析之前触发。`prompt()` 仍然只在完整接受的运行完成后才解析，包括重试。接受后的失败通过正常的事件和消息流报告，而不是通过 `preflightResult(false)`。

`prompt()` 方法处理 prompt 模板、扩展命令和消息发送：

```typescript
// 基本 prompt（非流式传输时）
await session.prompt('What files are here?');

// 带图像
await session.prompt("What's in this image?", {
  images: [{ type: 'image', source: { type: 'base64', mediaType: 'image/png', data: '...' } }],
});

// 流式传输期间：必须指定如何队列消息
await session.prompt('Stop and do this instead', { streamingBehavior: 'steer' });
await session.prompt("After you're done, also check X", { streamingBehavior: 'followUp' });
```

**行为：**

- **扩展命令**（例如 `/mycommand`）：立即执行，即使在流式传输期间。它们通过 `pi.sendMessage()` 管理自己的 LLM 交互。
- **基于文件的 prompt 模板**（来自 `.md` 文件）：在发送或队列前扩展为内容。
- **流式传输期间未指定 `streamingBehavior`**：抛出错误。直接使用 `steer()` 或 `followUp()`，或指定选项。
- **`preflightResult(true)`**：表示 prompt 被接受、排队或立即处理。
- **`preflightResult(false)`**：表示预检在接受前拒绝。

流式传输期间显式队列：

```typescript
// 队列一条 steering 消息，在当前助手回合完成工具调用后发送
await session.steer('New instruction');

// 等待 Agent 完成（仅在 Agent 停止时发送）
await session.followUp("After you're done, also do this");
```

`steer()` 和 `followUp()` 都会扩展基于文件的 prompt 模板，但在扩展命令上会报错（扩展命令不能被队列）。

### Agent 和 AgentState

`Agent` 类（来自 `@earendil-works/pi-agent-core`）处理核心 LLM 交互。通过 `session.agent` 访问。

```typescript
// 访问当前状态
const state = session.agent.state;

// state.messages: AgentMessage[] - 对话历史
// state.model: Model - 当前模型
// state.thinkingLevel: ThinkingLevel - 当前思考级别
// state.systemPrompt: string - 系统提示
// state.tools: AgentTool[] - 可用工具
// state.streamingMessage?: AgentMessage - 当前部分助手消息
// state.errorMessage?: string - 最新的助手错误

// 替换消息（用于分支或恢复）
session.agent.state.messages = messages; // 复制顶层数组

// 替换工具
session.agent.state.tools = tools; // 复制顶层数组

// 等待 Agent 完成处理
await session.agent.waitForIdle();
```

### 事件

订阅事件以接收流式输出和生命周期通知。

```typescript
session.subscribe((event) => {
  switch (event.type) {
    // 来自助手的流式文本
    case 'message_update':
      if (event.assistantMessageEvent.type === 'text_delta') {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      if (event.assistantMessageEvent.type === 'thinking_delta') {
        // 思考输出（如果启用思考）
      }
      break;

    // 工具执行
    case 'tool_execution_start':
      console.log(`Tool: ${event.toolName}`);
      break;
    case 'tool_execution_update':
      // 流式工具输出
      break;
    case 'tool_execution_end':
      console.log(`Result: ${event.isError ? 'error' : 'success'}`);
      break;

    // 消息生命周期
    case 'message_start':
      // 新消息开始
      break;
    case 'message_end':
      // 消息完成
      break;

    // Agent 生命周期
    case 'agent_start':
      // Agent 开始处理 prompt
      break;
    case 'agent_end':
      // Agent 完成（event.messages 包含新消息）
      break;

    // 回合生命周期（一次 LLM 响应 + 工具调用）
    case 'turn_start':
      break;
    case 'turn_end':
      // event.message: 助手响应
      // event.toolResults: 此回合的工具结果
      break;

    // 会话事件（队列、压缩、重试）
    case 'queue_update':
      console.log(event.steering, event.followUp);
      break;
    case 'compaction_start':
    case 'compaction_end':
    case 'auto_retry_start':
    case 'auto_retry_end':
      break;
  }
});
```

## 选项参考

### 目录

```typescript
const { session } = await createAgentSession({
  // DefaultResourceLoader 发现的工作目录
  cwd: process.cwd(), // 默认

  // 全局配置目录
  agentDir: '~/.pi/agent', // 默认（展开 ~）
});
```

`cwd` 被 `DefaultResourceLoader` 用于：

- 项目扩展（`.pi/extensions/`）
- 项目 Skills：
  - `.pi/skills/`
  - `cwd` 及其祖先目录中的 `.agents/skills/`（向上到 git 仓库根目录，不在仓库中时到文件系统根目录）
- 项目 Prompt（`.pi/prompts/`）
- 上下文文件（从 cwd 向上查找 `AGENTS.md`）
- 会话目录命名

`agentDir` 被 `DefaultResourceLoader` 用于：

- 全局扩展（`extensions/`）
- 全局 Skills：
  - `agentDir` 下的 `skills/`（例如 `~/.pi/agent/skills/`）
  - `~/.agents/skills/`
- 全局 Prompt（`prompts/`）
- 全局上下文文件（`AGENTS.md`）
- 设置（`settings.json`）
- 自定义模型（`models.json`）
- 凭证（`auth.json`）
- 会话（`sessions/`）

当传入自定义 `ResourceLoader` 时，`cwd` 和 `agentDir` 不再控制资源发现。它们仍影响会话命名和工具路径解析。

### 模型

```typescript
import { getModel } from '@earendil-works/pi-ai';
import { AuthStorage, ModelRegistry } from '@earendil-works/pi-coding-agent';

const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);

// 查找特定的内置模型（不检查 API Key 是否存在）
const opus = getModel('anthropic', 'claude-opus-4-5');
if (!opus) throw new Error('Model not found');

// 按 provider/id 查找任何模型，包括来自 models.json 的自定义模型
// （不检查 API Key 是否存在）
const customModel = modelRegistry.find('my-provider', 'my-model');

// 仅获取配置了有效 API Key 的模型
const available = await modelRegistry.getAvailable();

const { session } = await createAgentSession({
  model: opus,
  thinkingLevel: 'medium', // off, minimal, low, medium, high, xhigh

  // 用于循环的模型（交互模式中的 Ctrl+P）
  scopedModels: [
    { model: opus, thinkingLevel: 'high' },
    { model: haiku, thinkingLevel: 'off' },
  ],

  authStorage,
  modelRegistry,
});
```

如果未提供模型：

1. 尝试从会话恢复（如果正在继续）
2. 使用设置中的默认值
3. 回退到第一个可用模型

为匹配 CLI 的模型解析行为，可使用导出的解析器帮助函数：

```typescript
import { resolveCliModel, resolveModelScopeWithDiagnostics } from '@earendil-works/pi-coding-agent';

const cliModel = resolveCliModel({
  cliModel: 'anthropic/claude-opus-4-5:high',
  modelRegistry,
});
if (cliModel.error) throw new Error(cliModel.error);
if (cliModel.warning) console.warn(cliModel.warning);

const { scopedModels, diagnostics } = await resolveModelScopeWithDiagnostics(
  ['anthropic/*:high', 'gpt-5'],
  modelRegistry,
);
for (const diagnostic of diagnostics) {
  console.warn(diagnostic.message);
}
```

`resolveCliModel()` 使用全部已注册模型，这样 `--api-key` 形式的首次设置就能在存储凭证存在之前解析模型。`resolveModelScopeWithDiagnostics()` 匹配 `--models` 和 `enabledModels` 的语义，但返回警告而非直接打印。

> 参见 [examples/sdk/02-custom-model.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/02-custom-model.ts)

### API Key 和 OAuth

API Key 解析优先级（由 AuthStorage 处理）：

1. 运行时覆盖（通过 `setRuntimeApiKey`，不持久化）
2. `auth.json` 中存储的凭证（API Key 或 OAuth 令牌）
3. 环境变量（`ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 等）
4. 回退解析器（用于来自 `models.json` 的自定义 Provider Key）

```typescript
import { AuthStorage, ModelRegistry } from '@earendil-works/pi-coding-agent';

// 默认：使用 ~/.pi/agent/auth.json 和 ~/.pi/agent/models.json
const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage,
  modelRegistry,
});

// 运行时 API Key 覆盖（不持久化到磁盘）
authStorage.setRuntimeApiKey('anthropic', 'sk-my-temp-key');

// 自定义凭证存储位置
const customAuth = AuthStorage.create('/my/app/auth.json');
const customRegistry = ModelRegistry.create(customAuth, '/my/app/models.json');

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage: customAuth,
  modelRegistry: customRegistry,
});

// 无自定义 models.json（仅内置模型）
const simpleRegistry = ModelRegistry.inMemory(authStorage);
```

> 参见 [examples/sdk/09-api-keys-and-oauth.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts)

### 系统提示

使用 `ResourceLoader` 覆盖系统提示：

```typescript
import { createAgentSession, DefaultResourceLoader } from '@earendil-works/pi-coding-agent';

const loader = new DefaultResourceLoader({
  systemPromptOverride: () => 'You are a helpful assistant.',
});
await loader.reload();

const { session } = await createAgentSession({ resourceLoader: loader });
```

> 参见 [examples/sdk/03-custom-prompt.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/03-custom-prompt.ts)

### 工具

指定启用的内置工具：

- 内置工具名：`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`
- 默认内置工具：`read`、`bash`、`edit`、`write`
- `noTools: "all"` 禁用所有工具
- `noTools: "builtin"` 禁用默认内置工具，同时保持扩展和自定义工具启用
- `excludeTools` 在 `tools` 白名单应用后，禁用特定的内置、扩展或自定义工具名称

`edit` 工具返回 `details.diff` 供 Pi 的 TUI 展示，以及 `details.patch` 作为标准统一补丁（unified patch）供 SDK 消费者使用。

```typescript
import { createAgentSession } from '@earendil-works/pi-coding-agent';

// 只读模式
const { session } = await createAgentSession({
  tools: ['read', 'grep', 'find', 'ls'],
});

// 选择特定工具
const { session } = await createAgentSession({
  tools: ['read', 'bash', 'grep'],
});

// 禁用某个工具，同时保留其他工具可用
const { session } = await createAgentSession({
  excludeTools: ['ask_question'],
});
```

#### 使用自定义 cwd 的工具

当传入自定义 `cwd` 时，`createAgentSession()` 为该 cwd 构建选定的内置工具。

```typescript
import { createAgentSession, SessionManager } from '@earendil-works/pi-coding-agent';

const cwd = '/path/to/project';

// 为自定义 cwd 使用默认工具
const { session } = await createAgentSession({
  cwd,
  sessionManager: SessionManager.inMemory(cwd),
});

// 或为自定义 cwd 选择特定工具
const { session } = await createAgentSession({
  cwd,
  tools: ['read', 'bash', 'grep'],
  sessionManager: SessionManager.inMemory(cwd),
});
```

> 参见 [examples/sdk/05-tools.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/05-tools.ts)

### 自定义工具

```typescript
import { Type } from 'typebox';
import { createAgentSession, defineTool } from '@earendil-works/pi-coding-agent';

// 内联自定义工具
const myTool = defineTool({
  name: 'my_tool',
  label: 'My Tool',
  description: 'Does something useful',
  parameters: Type.Object({
    input: Type.String({ description: 'Input value' }),
  }),
  execute: async (_toolCallId, params) => ({
    content: [{ type: 'text', text: `Result: ${params.input}` }],
    details: {},
  }),
});

// 直接传入自定义工具
const { session } = await createAgentSession({
  customTools: [myTool],
});
```

使用 `defineTool()` 进行独立定义，如 `customTools: [myTool]`。内联 `pi.registerTool({ ... })` 已正确推断参数类型。

通过 `customTools` 传入的自定义工具与扩展注册的工具合并。由 ResourceLoader 加载的扩展也可以通过 `pi.registerTool()` 注册工具。

如果传入 `tools`，请包含你想要启用的每个自定义或扩展工具名称，例如 `tools: ["read", "bash", "my_tool"]`。

> 参见 [examples/sdk/05-tools.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/05-tools.ts)

### 扩展

扩展由 `ResourceLoader` 加载。`DefaultResourceLoader` 从 `~/.pi/agent/extensions/`、`.pi/extensions/` 和 settings.json 扩展源中发现扩展。

```typescript
import { createAgentSession, DefaultResourceLoader } from '@earendil-works/pi-coding-agent';

const loader = new DefaultResourceLoader({
  additionalExtensionPaths: ['/path/to/my-extension.ts'],
  extensionFactories: [
    (pi) => {
      pi.on('agent_start', () => {
        console.log('[Inline Extension] Agent starting');
      });
    },
  ],
});
await loader.reload();

const { session } = await createAgentSession({ resourceLoader: loader });
```

扩展可以注册工具、订阅事件、添加命令等。参见 [extensions.md](extensions.md) 了解完整 API。

**命名内联扩展：** 默认情况下，内联工厂在启动时的 Extensions 列表中显示为 `<inline:1>`、`<inline:2>` 等。要显示描述性名称，请包装工厂：

```typescript
import type { InlineExtension } from '@earendil-works/pi-coding-agent';

const myProvider: InlineExtension = {
  name: 'my-provider',
  factory: (pi) => {
    pi.on('agent_start', () => {
      console.log('[my-provider] Agent starting');
    });
  },
};

const loader = new DefaultResourceLoader({
  extensionFactories: [myProvider],
});
```

这样它会显示为 `<inline:my-provider>` 而不是 `<inline:1>`。裸工厂函数仍然受支持，以保持向后兼容。

**事件总线：** 扩展可以通过 `pi.events` 通信。如果需要从外部发出或监听事件，请将共享的 `eventBus` 传递给 `DefaultResourceLoader`：

```typescript
import { createEventBus, DefaultResourceLoader } from '@earendil-works/pi-coding-agent';

const eventBus = createEventBus();
const loader = new DefaultResourceLoader({
  eventBus,
});
await loader.reload();

eventBus.on('my-extension:status', (data) => console.log(data));
```

> 参见 [examples/sdk/06-extensions.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/06-extensions.ts) 和 [docs/extensions.md](extensions.md)

### Skills

```typescript
import { createAgentSession, DefaultResourceLoader, type Skill } from '@earendil-works/pi-coding-agent';

const customSkill: Skill = {
  name: 'my-skill',
  description: 'Custom instructions',
  filePath: '/path/to/SKILL.md',
  baseDir: '/path/to',
  source: 'custom',
};

const loader = new DefaultResourceLoader({
  skillsOverride: (current) => ({
    skills: [...current.skills, customSkill],
    diagnostics: current.diagnostics,
  }),
});
await loader.reload();

const { session } = await createAgentSession({ resourceLoader: loader });
```

> 参见 [examples/sdk/04-skills.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/04-skills.ts)

### 上下文文件

```typescript
import { createAgentSession, DefaultResourceLoader } from '@earendil-works/pi-coding-agent';

const loader = new DefaultResourceLoader({
  agentsFilesOverride: (current) => ({
    agentsFiles: [...current.agentsFiles, { path: '/virtual/AGENTS.md', content: '# Guidelines\n\n- Be concise' }],
  }),
});
await loader.reload();

const { session } = await createAgentSession({ resourceLoader: loader });
```

> 参见 [examples/sdk/07-context-files.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/07-context-files.ts)

### 斜杠命令

```typescript
import { createAgentSession, DefaultResourceLoader, type PromptTemplate } from '@earendil-works/pi-coding-agent';

const customCommand: PromptTemplate = {
  name: 'deploy',
  description: 'Deploy the application',
  source: '(custom)',
  content: '# Deploy\n\n1. Build\n2. Test\n3. Deploy',
};

const loader = new DefaultResourceLoader({
  promptsOverride: (current) => ({
    prompts: [...current.prompts, customCommand],
    diagnostics: current.diagnostics,
  }),
});
await loader.reload();

const { session } = await createAgentSession({ resourceLoader: loader });
```

> 参见 [examples/sdk/08-prompt-templates.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/08-prompt-templates.ts)

### 会话管理

会话使用带有 `id`/`parentId` 链接的树结构，支持原地分支。

```typescript
import {
  type CreateAgentSessionRuntimeFactory,
  createAgentSession,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  SessionManager,
} from '@earendil-works/pi-coding-agent';

// 内存模式（无持久化）
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});

// 新建持久化会话
const { session: persisted } = await createAgentSession({
  sessionManager: SessionManager.create(process.cwd()),
});

// 继续最近的会话
const { session: continued, modelFallbackMessage } = await createAgentSession({
  sessionManager: SessionManager.continueRecent(process.cwd()),
});
if (modelFallbackMessage) {
  console.log('Note:', modelFallbackMessage);
}

// 打开特定文件
const { session: opened } = await createAgentSession({
  sessionManager: SessionManager.open('/path/to/session.jsonl'),
});

// 列出会话
const currentProjectSessions = await SessionManager.list(process.cwd());
const allSessions = await SessionManager.listAll(process.cwd());

// 用于 /new、/resume、/fork、/clone 和导入流程的会话替换 API。
const createRuntime: CreateAgentSessionRuntimeFactory = async ({ cwd, sessionManager, sessionStartEvent }) => {
  const services = await createAgentSessionServices({ cwd });
  return {
    ...(await createAgentSessionFromServices({
      services,
      sessionManager,
      sessionStartEvent,
    })),
    services,
    diagnostics: services.diagnostics,
  };
};

const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  sessionManager: SessionManager.create(process.cwd()),
});

// 用新会话替换当前会话
await runtime.newSession();

// 用另一个已保存的会话替换当前会话
await runtime.switchSession('/path/to/session.jsonl');

// 从特定用户条目创建分支替换当前会话
await runtime.fork('entry-id');

// 通过特定条目克隆当前路径
await runtime.fork('entry-id', { position: 'at' });
```

**SessionManager 树 API：**

```typescript
const sm = SessionManager.open('/path/to/session.jsonl');

// 会话列表
const currentProjectSessions = await SessionManager.list(process.cwd());
const allSessions = await SessionManager.listAll(process.cwd());

// 树遍历
const entries = sm.getEntries(); // 所有条目（不含头部）
const tree = sm.getTree(); // 完整树结构
const path = sm.getPath(); // 从根到当前叶子的路径
const leaf = sm.getLeafEntry(); // 当前叶子条目
const entry = sm.getEntry(id); // 按 ID 获取条目
const children = sm.getChildren(id); // 条目的直接子节点

// 标签
const label = sm.getLabel(id); // 获取条目标签
sm.appendLabelChange(id, 'checkpoint'); // 设置标签

// 分支
sm.branch(entryId); // 将叶子移动到早期条目
sm.branchWithSummary(id, 'Summary...'); // 带上下文摘要的分支
sm.createBranchedSession(leafId); // 提取路径到新文件
```

> 参见 [examples/sdk/11-sessions.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/11-sessions.ts) 和 [Session Format](session-format.md)

### 设置管理

```typescript
import { createAgentSession, SettingsManager, SessionManager } from '@earendil-works/pi-coding-agent';

// 默认：从文件加载（全局 + 项目合并）
const { session } = await createAgentSession({
  settingsManager: SettingsManager.create(),
});

// 带覆盖
const settingsManager = SettingsManager.create();
settingsManager.applyOverrides({
  compaction: { enabled: false },
  retry: { enabled: true, maxRetries: 5 },
});
const { session } = await createAgentSession({ settingsManager });

// 内存模式（无文件 I/O，用于测试）
const { session } = await createAgentSession({
  settingsManager: SettingsManager.inMemory({ compaction: { enabled: false } }),
  sessionManager: SessionManager.inMemory(),
});

// 自定义目录
const { session } = await createAgentSession({
  settingsManager: SettingsManager.create('/custom/cwd', '/custom/agent'),
});
```

**静态工厂：**

- `SettingsManager.create(cwd?, agentDir?)` - 从文件加载
- `SettingsManager.inMemory(settings?)` - 无文件 I/O

**项目特定设置：**

设置从两个位置加载并合并：

1. 全局：`~/.pi/agent/settings.json`
2. 项目：`<cwd>/.pi/settings.json`

项目覆盖全局。嵌套对象合并键。Setter 默认修改全局设置。

**持久化和错误处理语义：**

- 设置 getter/setter 对于内存状态是同步的。
- Setter 异步排队持久化写入。
- 当需要持久化边界时调用 `await settingsManager.flush()`（例如，进程退出前或测试中断言文件内容前）。
- `SettingsManager` 不打印设置 I/O 错误。使用 `settingsManager.drainErrors()` 并在应用层报告。

> 参见 [examples/sdk/10-settings.ts](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk/10-settings.ts)

## ResourceLoader

使用 `DefaultResourceLoader` 发现扩展、Skills、Prompt、主题和上下文文件。

```typescript
import { DefaultResourceLoader, getAgentDir } from '@earendil-works/pi-coding-agent';

const loader = new DefaultResourceLoader({
  cwd,
  agentDir: getAgentDir(),
});
await loader.reload();

const extensions = loader.getExtensions();
const skills = loader.getSkills();
const prompts = loader.getPrompts();
const themes = loader.getThemes();
const contextFiles = loader.getAgentsFiles().agentsFiles;
```

## 返回值

`createAgentSession()` 返回：

```typescript
interface CreateAgentSessionResult {
  // 会话
  session: AgentSession;

  // 扩展结果（用于运行器设置）
  extensionsResult: LoadExtensionsResult;

  // 如果未能恢复会话模型的警告
  modelFallbackMessage?: string;
}

interface LoadExtensionsResult {
  extensions: Extension[];
  errors: Array<{ path: string; error: string }>;
  runtime: ExtensionRuntime;
}
```

## 完整示例

```typescript
import { getModel } from '@earendil-works/pi-ai';
import { Type } from 'typebox';
import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  defineTool,
  ModelRegistry,
  SessionManager,
  SettingsManager,
} from '@earendil-works/pi-coding-agent';

// 设置凭证存储（自定义位置）
const authStorage = AuthStorage.create('/custom/agent/auth.json');

// 运行时 API Key 覆盖（不持久化）
if (process.env.MY_KEY) {
  authStorage.setRuntimeApiKey('anthropic', process.env.MY_KEY);
}

// 模型注册表（无自定义 models.json）
const modelRegistry = ModelRegistry.create(authStorage);

// 内联工具
const statusTool = defineTool({
  name: 'status',
  label: 'Status',
  description: 'Get system status',
  parameters: Type.Object({}),
  execute: async () => ({
    content: [{ type: 'text', text: `Uptime: ${process.uptime()}s` }],
    details: {},
  }),
});

const model = getModel('anthropic', 'claude-opus-4-5');
if (!model) throw new Error('Model not found');

// 带覆盖的内存设置
const settingsManager = SettingsManager.inMemory({
  compaction: { enabled: false },
  retry: { enabled: true, maxRetries: 2 },
});

const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: '/custom/agent',
  settingsManager,
  systemPromptOverride: () => 'You are a minimal assistant. Be concise.',
});
await loader.reload();

const { session } = await createAgentSession({
  cwd: process.cwd(),
  agentDir: '/custom/agent',

  model,
  thinkingLevel: 'off',
  authStorage,
  modelRegistry,

  tools: ['read', 'bash', 'status'],
  customTools: [statusTool],
  resourceLoader: loader,

  sessionManager: SessionManager.inMemory(),
  settingsManager,
});

session.subscribe((event) => {
  if (event.type === 'message_update' && event.assistantMessageEvent.type === 'text_delta') {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt('Get status and list files.');
```

## 运行模式

SDK 导出了用于在 `createAgentSession()` 之上构建自定义界面的运行模式工具。

### InteractiveMode

完整的 TUI 交互模式，包含编辑器、聊天历史和所有内置命令：

```typescript
import {
  type CreateAgentSessionRuntimeFactory,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  InteractiveMode,
  SessionManager,
} from '@earendil-works/pi-coding-agent';

const createRuntime: CreateAgentSessionRuntimeFactory = async ({ cwd, sessionManager, sessionStartEvent }) => {
  const services = await createAgentSessionServices({ cwd });
  return {
    ...(await createAgentSessionFromServices({ services, sessionManager, sessionStartEvent })),
    services,
    diagnostics: services.diagnostics,
  };
};
const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  sessionManager: SessionManager.create(process.cwd()),
});

const mode = new InteractiveMode(runtime, {
  migratedProviders: [],
  modelFallbackMessage: undefined,
  initialMessage: 'Hello',
  initialImages: [],
  initialMessages: [],
});

await mode.run();
```

### runPrintMode

单次模式：发送 Prompt，输出结果，退出：

```typescript
import {
  type CreateAgentSessionRuntimeFactory,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  runPrintMode,
  SessionManager,
} from '@earendil-works/pi-coding-agent';

const createRuntime: CreateAgentSessionRuntimeFactory = async ({ cwd, sessionManager, sessionStartEvent }) => {
  const services = await createAgentSessionServices({ cwd });
  return {
    ...(await createAgentSessionFromServices({ services, sessionManager, sessionStartEvent })),
    services,
    diagnostics: services.diagnostics,
  };
};
const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  sessionManager: SessionManager.create(process.cwd()),
});

await runPrintMode(runtime, {
  mode: 'text',
  initialMessage: 'Hello',
  initialImages: [],
  messages: ['Follow up'],
});
```

### runRpcMode

用于子进程集成的 JSON-RPC 模式：

```typescript
import {
  type CreateAgentSessionRuntimeFactory,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  runRpcMode,
  SessionManager,
} from '@earendil-works/pi-coding-agent';

const createRuntime: CreateAgentSessionRuntimeFactory = async ({ cwd, sessionManager, sessionStartEvent }) => {
  const services = await createAgentSessionServices({ cwd });
  return {
    ...(await createAgentSessionFromServices({ services, sessionManager, sessionStartEvent })),
    services,
    diagnostics: services.diagnostics,
  };
};
const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  sessionManager: SessionManager.create(process.cwd()),
});

await runRpcMode(runtime);
```

参见 [RPC 文档](rpc.md) 了解 JSON 协议。

## RPC 模式替代方案

对于基于子进程的集成，无需使用 SDK 构建，直接使用 CLI：

```bash
pi --mode rpc --no-session
```

参见 [RPC 文档](rpc.md) 了解 JSON 协议。

SDK 更适合以下场景：

- 需要类型安全
- 在同一个 Node.js 进程中
- 需要直接访问 Agent 状态
- 希望以编程方式自定义工具/扩展

RPC 模式更适合以下场景：

- 从其他语言集成
- 需要进程隔离
- 构建语言无关的客户端

## 导出

主入口点导出：

```typescript
// 工厂
createAgentSession
createAgentSessionRuntime
AgentSessionRuntime

// 认证和模型
AuthStorage
ModelRegistry
resolveCliModel
resolveModelScopeWithDiagnostics

// 资源加载
DefaultResourceLoader
type ResourceLoader
createEventBus

// 常量与帮助函数
CONFIG_DIR_NAME
defineTool
getAgentDir
getPackageDir
getReadmePath
getDocsPath
getExamplesPath

// 会话管理
SessionManager
SettingsManager

// 工具工厂
createCodingTools
createReadOnlyTools
createReadTool, createBashTool, createEditTool, createWriteTool
createGrepTool, createFindTool, createLsTool

// 类型
type CreateAgentSessionOptions
type CreateAgentSessionResult
type ExtensionFactory
type InlineExtension
type ExtensionAPI
type ToolDefinition
type Skill
type PromptTemplate
type Tool
```

关于扩展类型，参见 [extensions.md](extensions.md) 了解完整 API。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
