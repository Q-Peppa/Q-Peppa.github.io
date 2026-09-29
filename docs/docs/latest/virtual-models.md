# 虚拟模型

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/virtual-models) 的中文翻译。仅供学习参考。

虚拟模型是一种可选模型，它为每次请求挑选一个物理模型。用它按任务、成本或对话状态做路由。例如，路由器可以把简单问题发给小模型、把难题发给大模型，而用户只需选择一个模型。

从[扩展](extensions.md)注册虚拟模型。它们会出现在 `/model`、`--model`、范围模型和设置中，和其他模型一样。虚拟模型可以列在任意 Provider 下，包括已有物理模型的 Provider，例如 `openai-codex/auto`。

## 选择与派发

虚拟模型选择的是一个模型和一个 thinking level。路由器把这对映射为每次请求的物理对：

```
selected (virtual model, virtual level)  ->  dispatched (physical model, physical level)
jev/auto:low                             ->  anthropic/claude-sonnet-4-5:high
```

虚拟 thinking level 是路由器的输入。含义由路由器决定；不必对应推理预算。

Pi 把这两对分开：

|          | 选择                                                                         | 派发                                                             |
| -------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 记录位置 | `model_change` 和 `thinking_level_change` 条目                               | 每条 assistant 消息：`provider`、`api`、`model`、`thinkingLevel` |
| 可见为   | `ctx.model`、`ctx.thinkingLevel`、`PI_MODEL`、`PI_REASONING_LEVEL`、`/model` | 每次响应的 assistant 消息                                        |

Provider 只收到物理模型。Assistant 消息写的是物理模型名，所以跨不同物理模型回放对话的行为，与手动切换模型后相同。恢复会话时，Pi 从最新的 `model_change` 条目还原虚拟选择。如果该虚拟模型已经不再注册，Pi 回退到上次作答的物理模型。

交互模式下，页脚在选择旁边显示路由后的模型，例如 `auto • high → gpt-5.6-luna • medium`。`/session` 列出每个物理模型的成本。

上下文用量使用产出最近一次响应的物理模型的上限，即使该响应发生在切换到虚拟模型之前。没有这样的响应时，使用虚拟模型上声明的上限（如果有）。压缩检查同样的上限，以及每次请求路由到的那个模型的上限。如果该模型的上下文窗口装不下对话，Pi 会在发送请求前压缩；路由保持路由器选定的结果。

## 注册虚拟模型

```typescript
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

export default function (pi: ExtensionAPI) {
  pi.registerVirtualModel({
    provider: 'router',
    id: 'auto',
    name: 'Auto',
    thinkingLevels: ['low', 'high'],
    route(request, ctx) {
      // Tool follow-ups and retries stay on the model that handled the turn.
      const sticky = request.failed ?? request.previous;
      if (request.reason !== 'user' && sticky) {
        return { model: sticky.model, thinkingLevel: sticky.thinkingLevel ?? 'medium' };
      }
      const id = request.thinkingLevel === 'high' ? 'claude-sonnet-4-5' : 'claude-haiku-4-5';
      return { model: ctx.modelRegistry.find('anthropic', id)!, thinkingLevel: 'medium' };
    },
  });
}
```

- `provider` 是该模型所列的 Provider。可以是任意 Provider ID。一个 Provider 可以在物理模型旁边列出多个虚拟模型。在物理 Provider 上，该虚拟模型在该 Provider 有凭证时可用。在没有 Provider 使用的 ID 下，它始终可用。
- `id` 不能是该 Provider 某个物理模型的 ID。如果之后目录刷新加入了同 ID 的物理模型，虚拟模型会把它藏起来。
- `thinkingLevels` 列出可供选择的等级。默认为 `["off"]`。
- `contextWindow` 和 `maxTokens` 在第一次响应之前显示。未设置的上限视为未知。
- `input` 列出可供选择的输入类型。默认为文本和图片；不支持图片的物理模型会收到占位符。

注册遵循与 `pi.registerProvider()` 相同的排队和重载规则。再次注册相同的 Provider 和 ID 会替换该虚拟模型。`pi.unregisterVirtualModel(provider, id)` 会移除它；`pi.unregisterProvider()` 不会。SDK 代码可以不通过扩展注册：`modelRuntime.registerVirtualModel(definition)`。

## 路由请求

`route(request, ctx)` 在使用该虚拟模型发出的每次请求之前运行，并返回 `{ model, thinkingLevel }`。模型可以是目录中任意已有凭证的物理模型；用 `ctx.modelRegistry` 查找。虚拟模型不能路由到另一个虚拟模型。Pi 会把 thinking level 钳制到返回的模型。

| 字段                     | 含义                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`、`thinkingLevel` | 所选的虚拟模型和等级                                                                                                                                              |
| `reason`                 | 为何发出该请求，见下                                                                                                                                              |
| `previous`               | `messages` 中最近一次成功响应的物理模型和 thinking level                                                                                                          |
| `failed`                 | 用于 `retry`：失败请求的物理模型、thinking level 和 assistant `message`，`messages` 中已不含该消息。消息带有 `stopReason` 和 `errorMessage`。路由本身失败时不存在 |
| `state`                  | 该会话分支上一次返回的路由器状态，见下                                                                                                                            |
| `messages`               | 本次请求的对话，包括系统消息                                                                                                                                      |
| `signal`                 | 该请求的 abort signal                                                                                                                                             |

| `reason`       | 请求                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------- |
| `user`         | 用户写出一条消息之后的第一次请求，包括 steering 和 follow-up 消息                        |
| `continuation` | Agent 循环中的其他请求，例如 tool result 或扩展消息之后                                  |
| `retry`        | 失败请求之后的自动重试，包括因上下文溢出而压缩之后                                       |
| `direct`       | 在 Agent 循环之外发出的请求，例如压缩摘要，或扩展调用 `ctx.modelRegistry.streamSimple()` |

对 `continuation` 返回 `previous`、对 `retry` 返回 `failed`，可以保持 Prompt 缓存和 thinking 签名有效。回合之间切换模型是允许的，但会丢失 Prompt 缓存。重试也可以切到另一个模型，例如当 `failed.message.errorMessage` 报告 Provider 过载或上下文溢出时。

如果 `route()` 抛出，或返回虚拟模型、或返回没有凭证的模型，该请求以错误响应结束。

## 保留路由状态

`route()` 可以在模型旁边返回 `state`。Pi 把它存在会话分支上，并在后续请求中作为 `request.state` 传回。用它保存转录未记录的决策，例如分类器结果或路由阶段：

```typescript
pi.registerVirtualModel<{ phase: 'plan' | 'build' }>({
  provider: 'router',
  id: 'phased',
  name: 'Phased',
  route(request, ctx) {
    const state = request.state ?? { phase: 'plan' };
    const id = state.phase === 'plan' ? 'claude-opus-4-5' : 'claude-haiku-4-5';
    return { model: ctx.modelRegistry.find('anthropic', id)!, thinkingLevel: 'medium', state };
  },
});
```

- 状态必须可 JSON 序列化。返回 `undefined` 或 `request.state` 本身会保留当前状态。
- Pi 把任何其他返回的对象存为新状态，发生在请求发送之前，即使它等于当前状态。只在状态变化时返回新对象。之后请求失败时，该状态仍会保留。
- 状态跟随会话树，所以 fork 和 `/tree` 导航看到的是各自分支的状态。它能在压缩后存活。
- `direct` 请求没有状态，Pi 会忽略它们返回的状态。

转录已经记录了选择和每次派发的模型，`ctx.sessionManager.getBranch()` 会同时暴露两者。

路由器可以通过 `ctx.modelRegistry` 调用其他模型，例如用 `ctx.modelRegistry.findOfType("classifier", provider, id)` 找到分类器模型，再调用 `ctx.modelRegistry.classify()`。该调用会在该回合第一个 Token 之前增加延迟。

完整路由器见 [`jev-router.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/jev-router.ts)。它在 Jev 分类器选出的较强 OpenAI Codex 模型上做规划，让该模型完成第一次编辑，然后一次性切到更便宜的模型，接受一次 Prompt 缓存未命中。它把阶段保存在路由器状态中。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
