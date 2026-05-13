# JSON Event Stream Mode（JSON 事件流模式）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/json) 的中文翻译。仅供学习参考。

## 命令

```bash
pi --mode json "Your prompt"
```

该模式将所有会话事件作为 JSON 行输出到 stdout。适用于将 Pi 集成到其他工具或自定义 UI。

## 事件类型

- **agent_start** / **agent_end** —— Agent 生命周期
- **turn_start** / **turn_end** —— 回合生命周期
- **message_start** / **message_update** / **message_end** —— 消息生命周期
- **tool_execution_start** / **tool_execution_update** / **tool_execution_end** —— 工具执行
- **queue_update** —— 队列更新
- **compaction_start** / **compaction_end** —— 压缩
- **auto_retry_start** / **auto_retry_end** —— 自动重试

## 消息类型

基础消息：
- `UserMessage` —— 用户消息
- `AssistantMessage` —— 助手消息，包含 content 数组、usage、stopReason
- `ToolResultMessage` —— 工具结果

扩展消息：
- `BashExecutionMessage` —— Bash 命令执行
- `CustomMessage` —— 自定义消息
- `BranchSummaryMessage` —— 分支摘要
- `CompactionSummaryMessage` —— 压缩摘要

## 输出格式

每行是一个 JSON 对象。第一行是会话头：

```json
{"type":"session","version":3,"id":"uuid","timestamp":"...","cwd":"/path"}
```

随后是事件流：

```json
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"assistant","content":[],...}}
{"type":"message_update","message":{...},"assistantMessageEvent":{"type":"text_delta","delta":"Hello",...}}
{"type":"message_end","message":{...}}
{"type":"turn_end","message":{...},"toolResults":[]}
{"type":"agent_end","messages":[...]}
```

## 示例

```bash
pi --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
