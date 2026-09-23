# RPC 扩展 UI

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/rpc-extension-ui) 的中文翻译。仅供学习参考。

扩展可以通过 `ctx.ui` 请求用户交互。在 RPC 模式下，受支持的调用会成为与常规 [RPC 命令](rpc-commands.md)和[会话事件](json.md)并行的请求/响应子协议。

扩展 UI 方法有两类：

- **对话框方法**（`select`、`confirm`、`input`、`editor`）：在 stdout 上发出 `extension_ui_request` 并阻塞，直到客户端在 stdin 上传回带匹配 `id` 的 `extension_ui_response`。
- **即发即弃方法**（`notify`、`setStatus`、`setWidget`、`setTitle`、`set_editor_text`）：在 stdout 上发出 `extension_ui_request`，但不期望响应。客户端可以显示这些信息，也可以忽略。

如果某个对话框方法包含 `timeout` 字段，超时到期时 Agent 侧会用默认值自动解决。客户端不需要跟踪超时。

## 限制

有些 `ExtensionUIContext` 方法在 RPC 模式下不受支持或会降级，因为它们需要直接访问终端 UI：

- `custom()` 返回 `undefined`。
- `onTerminalInput()` 返回一个空的取消订阅函数。
- `setWorkingMessage()`、`setWorkingVisible()`、`setWorkingIndicator()`、`setHiddenThinkingLabel()`、`setFooter()`、`setHeader()`、`addAutocompleteProvider()`、`setEditorComponent()` 和 `setToolsExpanded()` 都是空操作。
- `getEditorText()` 返回 `""`，`getEditorComponent()` 返回 `undefined`。
- `getToolsExpanded()` 返回 `false`。
- `pasteToEditor()` 委托给 `setEditorText()`，没有终端粘贴处理。
- `getAllThemes()` 返回 `[]`，`getTheme()` 返回 `undefined`。
- `setTheme()` 返回 `{ success: false, error: "Theme switching not supported in RPC mode" }`。

注意：RPC 模式下 `ctx.mode` 是 `"rpc"`，`ctx.hasUI` 是 `true`，因为对话框和即发即弃方法通过扩展 UI 子协议可以工作。用 `ctx.mode === "tui"` 来守住 `custom()` 这类需要真实终端的 TUI 专用功能。

## 来自 Pi 的请求

所有请求都有 `type: "extension_ui_request"`、唯一的 `id` 和一个 `method` 字段。

### select

提示用户从列表中选择。带 `timeout` 字段的对话框方法会包含以毫秒为单位的超时；如果客户端未及时响应，Agent 会用 `undefined` 自动解决。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-1",
  "method": "select",
  "title": "Allow dangerous command?",
  "options": ["Allow", "Block"],
  "timeout": 10000
}
```

期望的响应：带 `value`（选中的选项字符串）或 `cancelled: true` 的 `extension_ui_response`。

### confirm

提示用户做是/否确认。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-2",
  "method": "confirm",
  "title": "Clear session?",
  "message": "All messages will be lost.",
  "timeout": 5000
}
```

期望的响应：带 `confirmed: true/false` 或 `cancelled: true` 的 `extension_ui_response`。

### input

提示用户输入自由文本。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-3",
  "method": "input",
  "title": "Enter a value",
  "placeholder": "type something..."
}
```

期望的响应：带 `value`（输入的文本）或 `cancelled: true` 的 `extension_ui_response`。

### editor

打开带可选预填内容的多行文本编辑器。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-4",
  "method": "editor",
  "title": "Edit some text",
  "prefill": "Line 1\nLine 2\nLine 3"
}
```

期望的响应：带 `value`（编辑后的文本）或 `cancelled: true` 的 `extension_ui_response`。

### notify

显示一条通知。即发即弃，不期望响应。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-5",
  "method": "notify",
  "message": "Command blocked by user",
  "notifyType": "warning"
}
```

`notifyType` 字段是 `"info"`、`"warning"` 或 `"error"`。省略时默认为 `"info"`。

### setStatus

在页脚/状态栏设置或清除一个状态条目。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-6",
  "method": "setStatus",
  "statusKey": "my-ext",
  "statusText": "Turn 3 running..."
}
```

发送 `statusText: undefined`（或省略它）可以清除该 key 的状态条目。

### setWidget

设置或清除编辑器上方或下方显示的 widget（若干行文本）。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-7",
  "method": "setWidget",
  "widgetKey": "my-ext",
  "widgetLines": ["--- My Widget ---", "Line 1", "Line 2"],
  "widgetPlacement": "aboveEditor"
}
```

发送 `widgetLines: undefined`（或省略它）可以清除该 widget。`widgetPlacement` 字段是 `"aboveEditor"`（默认）或 `"belowEditor"`。RPC 模式只支持字符串数组；组件工厂会被忽略。

### setTitle

设置终端窗口/标签页标题。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-8",
  "method": "setTitle",
  "title": "pi - my project"
}
```

### set_editor_text

设置输入编辑器中的文本。即发即弃。

```json
{
  "type": "extension_ui_request",
  "id": "uuid-9",
  "method": "set_editor_text",
  "text": "prefilled text for the user"
}
```

## 发回 Pi 的响应

只有对话框方法（`select`、`confirm`、`input`、`editor`）需要发送响应。`id` 必须与请求匹配。

### 值响应（select、input、editor）

```json
{ "type": "extension_ui_response", "id": "uuid-1", "value": "Allow" }
```

### 确认响应（confirm）

```json
{ "type": "extension_ui_response", "id": "uuid-2", "confirmed": true }
```

### 取消响应（任意对话框）

关闭任意对话框方法。扩展收到 `undefined`（对 select/input/editor）或 `false`（对 confirm）。

```json
{ "type": "extension_ui_response", "id": "uuid-3", "cancelled": true }
```

## 示例

见已检入的 [RPC 扩展 UI 客户端](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/rpc-extension-ui.ts)及其[演示扩展](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/rpc-demo.ts)。

导出的请求和响应联合类型定义在 [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts)。与模式无关的扩展指引见[扩展](extensions.md#ui-and-modes)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
