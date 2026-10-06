# Codemode

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/codemode) 的中文翻译。仅供学习参考。

`codemode` 工具让模型编写 JavaScript 脚本，调用 pi 的其他工具，并运行非 LLM 模型（例如分类器和图片模型）。只有脚本的输出会到达模型，因此脚本可以并行运行调用，并在模型看到之前过滤大量结果。如何打开它，见[启用 codemode](cli.md#enable-codemode)。

<a id="scripts"></a>

## 脚本

工具输入是原始 JavaScript 源码，不是 JSON，也不是 markdown 代码围栏。它作为 async 函数体在 QuickJS 沙箱中运行，因此顶层 `await` 和 `return` 可用。沙箱没有 Node API、文件系统、网络或定时器；脚本只能通过工具和 `models` 接触外部世界。

脚本可以以选项行开头：

```js
// @options: {"max_output_tokens": 2000, "timeout_ms": 60000}
```

- `max_output_tokens`（默认 10000）限制输出。更长的输出保留首尾，完整文本写入临时文件，路径包含在结果中。当输出超过 16777216 个字符的文本与 base64 图片数据，或超过 100000 次 `text()`、`image()` 和 `console` 调用时，脚本会失败；请改用工具把大数据写入文件。
- `timeout_ms` 是整个脚本的硬截止时间。默认未设置。生成图片可能需要几分钟，因此生成图片的脚本不要设太短的截止时间。

结果以 `Script completed` 或 `Script failed` 开头，然后是墙钟时间和输出。失败的脚本保留部分输出，后面是 `Script error:` 和错误。工具调用是真实的：失败前已发出的调用不会撤销。脚本结束时仍在运行的调用会被取消，未 await 的 promise 会被丢弃。

<a id="globals"></a>

## 全局变量

| 全局变量                                     | 用途                                                                                                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.<name>(args)`                         | 调用一个工具。见[调用工具](#call-tools)。                                                                                                                                                                                                                           |
| `text(value)`                                | 向输出添加文本项。字符串原样添加，其他值转为 JSON。                                                                                                                                                                                                                 |
| `image(value)`                               | 向输出添加图片：base64 `data:` URL、`{ image_url }` 对象，或 `{ type: "image", data, mimeType }` 图片块（MCP 工具和 `models.generateImages()` 会返回这种块）。不支持远程 URL。接受 PNG、JPEG、GIF 和 WebP。每张图片也会保存到临时文件，结果会在图片之前给出该路径。 |
| `console.log(...)`                           | 与 `text()` 相同；`info`、`warn`、`error` 和 `debug` 也一样。                                                                                                                                                                                                       |
| `return value`                               | 顶层 `return` 像 `text()` 一样添加该值。                                                                                                                                                                                                                            |
| `exit()`                                     | 成功结束脚本。                                                                                                                                                                                                                                                      |
| `store(key, value)` / `load(key)`            | 在 `codemode` 调用之间保存小的 JSON 值。见[存储值](#store-values)。                                                                                                                                                                                                 |
| `ALL_TOOLS`                                  | 每个可调用工具，形式为 `{ name, description }`，包括描述中未列出的工具。                                                                                                                                                                                            |
| `searchTools(query, { limit?, namespace? })` | 按相关度给可调用工具排序（BM25，默认 limit 8）。解析为 `{ name, description }[]`。                                                                                                                                                                                  |
| `describeTool(name)`                         | 解析为工具的描述和 TypeScript 声明，或 `undefined`。                                                                                                                                                                                                                |
| `describeNamespace(name)`                    | 解析为某个 namespace（例如一个 MCP 服务器）的 `{ name, description?, instructions?, tools }`，或 `undefined`。                                                                                                                                                      |
| `models`                                     | 列出并运行非 LLM 模型。见[模型](#models)。                                                                                                                                                                                                                          |

<a id="call-tools"></a>

## 调用工具

会话能调用的每个工具都是 `tools` 的一个方法，按标识符命名：不是合法 JavaScript 标识符的字符会变成 `_`，因此 MCP 工具 `mcp__dev-radius__search` 是 `tools.mcp__dev_radius__search`。每个方法接受一个包含该工具参数的对象。

调用解析成什么取决于工具：

- 带 output schema 的工具解析为结构化值。`bash` 解析为 `{ output, truncated, full_output_path?, exit_code, wall_time_seconds }`，非零退出码也如此。它的 `output` 不受模型看到的 2000 行或 50KB 限制：最多保留 1 MiB，更长的输出在省略标记两侧保留首尾各 512 KiB，并设置 `truncated`，完整输出在 `full_output_path`。
- MCP 工具解析为它们的 `CallToolResult`，包括 `isError` 和 `structuredContent`。
- `read` 解析为文件的文本；对图片则解析为 `image()` 能展示的图片块 `{ type: "image", data, mimeType, note }`。`data` 是模型会看到的 base64 图片，`note` 是随附的文本，例如缩放提示。
- 其他工具（例如 `edit` 和 `write`）解析为文本输出。

调用失败、被拦截或参数无效时，会以携带工具错误文本的 `Error` reject。用 `Promise.allSettled()` 可以保留成功调用的结果。

`codemode` 描述用 TypeScript 声明列出工具，按 namespace 分组（例如一个 MCP 服务器）。`deferred` exposure 的工具（包括默认 `codemode` exposure 的 MCP 工具）不列出，因此 MCP 服务器连接时描述保持不变。列出的声明共享 3000 估计 Token 的预算（[设置](settings.md#tools)中的 `codemode.inlineBudget`）。脚本用 `searchTools()`、`describeTool()`、`describeNamespace()` 查找其余工具，或过滤 `ALL_TOOLS`。

`codemode` 激活时，[设置](settings.md#tools)中的 `codemode.mode` 决定其他工具如何呈现。`on`（默认）时，已声明的工具继续声明，描述中说明如何从脚本调用它们。`only` 时，它们对模型隐藏，改列在 `codemode` 描述中，因此模型通过脚本调用它们。`codemode` 描述中的工具声明、`describeTool()` 和 `ALL_TOOLS` 会带上工具的 prompt guidelines，因为系统 prompt 规则只覆盖已声明的工具。

<a id="store-values"></a>

## 存储值

`store(key, value)` 把 JSON 值保存在字符串 key 下，供之后的 `codemode` 调用使用；存 `undefined` 会删除该 key。`load(key)` 返回该值，或 `undefined`。只有脚本成功时才会保留写入：每个成功存储值的脚本会向会话追加一条 `codemode-store` 自定义条目，因此恢复的会话保留这些值，每个分支只看到自己路径上写入的值。

store 用于 ID、游标或摘要这类小状态。单个值的 JSON 最多 262144 个字符，全部值合计最多 1048576。不要存图片数据；用 `image()` 展示图片，它也会把图片保存到临时文件。

<a id="models"></a>

## 模型

`models` 访问模型目录，并用会话凭证运行非 LLM 模型：分类器（针对 JSON 状态回答带类型的问题）和图片模型（生成图片）。聊天模型会被列出，但不能从脚本运行。有哪些分类器和图片模型，见[使用分类器模型](models.md#use-classifier-models) 和 [使用图片模型](models.md#use-image-models)。

```ts
type ModelType = 'chat' | 'image' | 'classifier';

/** A catalog entry. `provider` and `id` identify it; other fields depend on the type. */
interface ModelInfo {
  type?: ModelType;
  provider: string;
  id: string;
  name: string;
  api: string;
  input: ('text' | 'image')[];
  contextWindow?: number;
  [key: string]: unknown;
}

declare const models: {
  /** Every known model of a type, optionally for one provider. */
  getModelsOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** Models of a type whose provider has working credentials. */
  getAvailableOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** One catalog entry, or undefined. */
  getModelOfType(type: ModelType, provider: string, id: string): Promise<ModelInfo | undefined>;
  /** Answer `context.questions` about `context.state`; answers are in `result.answers` by question ID. */
  classify(model: ModelInfo, context: ClassifierContext): Promise<ClassifierResult>;
  /** Generate images from `context.input` text and image blocks; show `result.output` blocks with image(). Can take minutes. */
  generateImages(model: ModelInfo, context: ImagesContext): Promise<ImagesResult>;
};
```

`classify()` 和 `generateImages()` 只用 `model` 的 `provider` 和 `id`，因此 `{ provider, id }` 也可以。它们在 Provider 出错时不会抛出：检查 `stopReason` 和 `errorMessage`。每个脚本最多同时运行四个这样的调用；更多调用会等待空闲槽位，因此对许多项使用 `Promise.all()` 没问题。它们的用量会加到 `codemode` 工具结果上，并计入会话费用。

不同 Provider 的模型 ID 不同，例如 `typesafe/jev-latest` 和 `openrouter/typesafe/jev-1.13`。用 `models.getAvailableOfType(type)` 查找当前凭证可用的 ID。

<a id="classify"></a>

### 分类

```ts
interface ClassifierContext {
  /** The data to classify. */
  state: Record<string, unknown>;
  /** Questions by ID. One call answers all of them. */
  questions: Record<string, ClassifierQuestion>;
}

type ClassifierQuestion =
  /** Pick one label. `criteria` maps each label to what it means. */
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  /** Score on an ordered scale. `criteria` describes each level, lowest first. */
  | { type: 'score'; instructions: string; criteria: string[] }
  /** Yes or no. */
  | { type: 'bool'; instructions: string; criteria: { true: string; false: string } };

interface ClassifierResult {
  provider: string;
  model: string;
  /** Answers by question ID. */
  answers: Record<string, ClassifierAnswer>;
  usage?: ModelUsage;
  stopReason: 'stop' | 'error' | 'aborted';
  errorMessage?: string;
}

type ClassifierAnswer =
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  /** `score` is the expected level index, from 0 to `criteria.length - 1`. */
  | { type: 'score'; score: number; confidence: number }
  /** Probability of `true`. */
  | { type: 'bool'; probability: number };

/** Token counts and cost in USD, when the service reports them. */
type ModelUsage = { input: number; output: number; totalTokens: number; cost: { total: number } };
```

对多个条目分类时，每个条目调用一次 `classify()`。下面的脚本给反馈消息排序，例如脚本前面某个工具返回的那些：

```js
const jev = await models.getModelOfType('classifier', 'typesafe', 'jev-latest');
const results = await Promise.all(
  messages.map((message) =>
    models.classify(jev, {
      state: { message },
      questions: {
        sentiment: {
          type: 'choice',
          instructions: 'How does the user feel about the product?',
          criteria: { positive: 'Satisfied or happy', negative: 'Unhappy or frustrated', neutral: 'Neither' },
        },
        urgency: {
          type: 'score',
          instructions: 'How urgently does this need a reply?',
          criteria: ['no reply needed', 'reply this week', 'reply today'],
        },
      },
    }),
  ),
);
return results.map((result, i) =>
  result.stopReason === 'stop'
    ? { message: messages[i], sentiment: result.answers.sentiment.choice, urgency: result.answers.urgency.score }
    : { message: messages[i], error: result.errorMessage },
);
```

<a id="generate-images"></a>

### 生成图片

```ts
interface ImagesContext {
  /** The prompt as text blocks, plus image blocks to edit or use as references. */
  input: (TextBlock | ImageBlock)[];
}

interface ImagesResult {
  provider: string;
  model: string;
  /** Generated images, and text blocks for models that also return text. */
  output: (TextBlock | ImageBlock)[];
  usage?: ModelUsage;
  stopReason: 'stop' | 'error' | 'aborted';
  errorMessage?: string;
}

type TextBlock = { type: 'text'; text: string };
/** `data` is base64. */
type ImageBlock = { type: 'image'; data: string; mimeType: string };
```

用 `image(block)` 展示生成的图片。不要用 `text()`、`console` 或 `return` 打印 `data`：它很大，模型也无法当文本读。`image()` 还会把每张图片保存到临时文件，并把路径放进结果，所以之后的轮次可以复制或移动该文件。

```js
// @options: {"timeout_ms": 300000}
const painter = await models.getModelOfType('image', 'openrouter', 'google/gemini-2.5-flash-image');
const result = await models.generateImages(painter, {
  input: [{ type: 'text', text: 'A red fox in the snow, watercolor' }],
});
if (result.stopReason !== 'stop') return result.errorMessage;
for (const block of result.output) {
  if (block.type === 'image') image(block);
  else text(block.text);
}
```

<a id="limits"></a>

## 限制

- 脚本的 VM 有 256 MB 内存。用尽会抛出 `InternalError: out of memory`；过滤或聚合大数据，不要一直累积。
- 脚本等待一个永远无法 settle 的 promise（没有待处理的工具调用）会立即失败，因为没有定时器。
- 脚本不能启动其他 `codemode` 脚本。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
