# RPC Mode（RPC 模式）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/rpc) 的中文翻译。仅供学习参考。

RPC 模式通过 stdin/stdout 上的 JSON 协议实现 Agent 的无界面操作，用于嵌入其他应用、IDE 或自定义 UI。

对于 Node.js/TypeScript 用户，建议直接使用 SDK 的 `AgentSession`，而非生成子进程。

## 启动 RPC 模式

```bash
pi --mode rpc [options]
```

常用选项：`--provider <name>`、`--model <pattern>`、`--no-session`、`--session-dir <path>`。

## 协议概述

三类 JSON 消息在 stdin/stdout 上流动：

- **Commands**（命令）：发送到 stdin 的 JSON 对象，每行一个
- **Responses**（响应）：带 `type: "response"` 的 JSON 对象，指示命令成功/失败
- **Events**（事件）：流式输出到 stdout 的 Agent 事件（JSON 行）

所有命令支持可选的 `id` 字段用于请求/响应关联。

## 命令

### Prompting

**prompt** —— 发送用户 Prompt：

```json
{"type": "prompt", "message": "Hello, world!"}
```

带图像：

```json
{"type": "prompt", "message": "What's in this image?", "images": [{"type": "image", "data": "base64-encoded-data", "mimeType": "image/png"}]}
```

流式传输期间需要 `streamingBehavior`：`"steer"` 或 `"followUp"`。

**steer** —— 在 Agent 运行期间队列 steering 消息：

```json
{"type": "steer", "message": "Stop and do this instead"}
```

**follow_up** —— 队列 follow-up 消息：

```json
{"type": "follow_up", "message": "After you're done, also do this"}
```

**abort** —— 中断当前 Agent 操作：

```json
{"type": "abort"}
```

**new_session** —— 开始新会话：

```json
{"type": "new_session"}
```

### 状态

**get_state** —— 获取当前会话状态。返回 model、thinkingLevel、isStreaming、sessionFile、sessionId、messageCount 等。

**get_messages** —— 获取所有对话消息。

### 模型

**set_model** —— 切换模型：

```json
{"type": "set_model", "provider": "anthropic", "modelId": "claude-sonnet-4-20250514"}
```

**cycle_model** —— 循环到下一个可用模型。

**get_available_models** —— 列出所有已配置模型。

### Thinking

**set_thinking_level** —— 设置思维级别（`"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"`）：

```json
{"type": "set_thinking_level", "level": "high"}
```

### 压缩

**compact** —— 手动压缩上下文：

```json
{"type": "compact", "customInstructions": "Focus on code changes"}
```

**set_auto_compaction** —— 启用/禁用自动压缩：

```json
{"type": "set_auto_compaction", "enabled": true}
```

### 重试

**set_auto_retry** —— 启用/禁用自动重试：

```json
{"type": "set_auto_retry", "enabled": true}
```

### Bash

**bash** —— 执行 Shell 命令：

```json
{"type": "bash", "command": "ls -la"}
```

### 会话

**get_session_stats** —— 获取 Token 使用和成本统计。

**export_html** —— 导出会话为 HTML。

**switch_session** —— 加载不同会话文件。

**fork** —— 从之前的用户消息创建新分叉。

**clone** —— 复制当前活跃分支到新会话。

## 事件

事件作为 JSON 行流式输出到 stdout。事件类型包括：`agent_start`、`agent_end`、`turn_start`、`turn_end`、`message_start`、`message_update`、`message_end`、`tool_execution_start`、`tool_execution_update`、`tool_execution_end`、`queue_update`、`compaction_start`、`compaction_end`、`auto_retry_start`、`auto_retry_end`。

### 流式文本（message_update）

```json
{"type": "message_update", "message": {...}, "assistantMessageEvent": {"type": "text_delta", "delta": "Hello", "partial": {...}}}
```

### 错误处理

```json
{"type": "response", "command": "set_model", "success": false, "error": "Model not found"}
```

## 示例：Python 客户端

```python
import subprocess, json

proc = subprocess.Popen(
    ["pi", "--mode", "rpc", "--no-session"],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True
)

# 发送 Prompt
proc.stdin.write(json.dumps({"type": "prompt", "message": "Hello!"}) + "\n")
proc.stdin.flush()

# 读取事件
for line in proc.stdout:
    event = json.loads(line)
    if event.get("type") == "message_update":
        delta = event.get("assistantMessageEvent", {})
        if delta.get("type") == "text_delta":
            print(delta["delta"], end="", flush=True)
    elif event.get("type") == "agent_end":
        break
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
