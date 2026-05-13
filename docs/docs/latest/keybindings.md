# Keybindings（快捷键）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/keybindings) 的中文翻译。仅供学习参考。

所有键盘快捷键可通过 `~/.pi/agent/keybindings.json` 自定义。每个操作可绑定一个或多个按键。编辑文件后运行 `/reload` 在 Pi 中应用更改，无需重启。

## 按键格式

格式：`modifier+key`，修饰键包括 `ctrl`、`shift`、`alt`（可组合）。

- **字母键**：`a-z`
- **数字键**：`0-9`
- **特殊键**：escape、esc、enter、return、tab、space、backspace、delete、insert、clear、home、end、pageUp、pageDown、up、down、left、right
- **功能键**：`f1`–`f12`
- **符号**：`` ` ``、`-`、`=`、`[`、`]`、`\`、`;`、`'`、`,`、`.`、`/`

修饰键组合示例：`ctrl+shift+x`、`alt+ctrl+x`、`ctrl+1`

## 所有操作分类

### TUI 编辑器光标移动

| ID | 默认键 | 说明 |
|---|---|---|
| `tui.editor.cursorUp` | `up` | 光标上移 |
| `tui.editor.cursorDown` | `down` | 光标下移 |
| `tui.editor.cursorLeft` | `left`、`ctrl+b` | 光标左移 |
| `tui.editor.cursorRight` | `right`、`ctrl+f` | 光标右移 |
| `tui.editor.cursorWordLeft` | `alt+left`、`ctrl+left`、`alt+b` | 光标左移一个单词 |
| `tui.editor.cursorWordRight` | `alt+right`、`ctrl+right`、`alt+f` | 光标右移一个单词 |
| `tui.editor.cursorLineStart` | `home`、`ctrl+a` | 移至行首 |
| `tui.editor.cursorLineEnd` | `end`、`ctrl+e` | 移至行尾 |
| `tui.editor.pageUp` | `pageUp` | 上翻页 |
| `tui.editor.pageDown` | `pageDown` | 下翻页 |

### TUI 编辑器删除

| ID | 默认键 | 说明 |
|---|---|---|
| `tui.editor.deleteCharBackward` | `backspace` | 删除前一个字符 |
| `tui.editor.deleteCharForward` | `delete`、`ctrl+d` | 删除后一个字符 |
| `tui.editor.deleteWordBackward` | `ctrl+w`、`alt+backspace` | 向前删除一个单词 |
| `tui.editor.deleteWordForward` | `alt+d`、`alt+delete` | 向后删除一个单词 |
| `tui.editor.deleteToLineStart` | `ctrl+u` | 删除到行首 |
| `tui.editor.deleteToLineEnd` | `ctrl+k` | 删除到行尾 |

### TUI 输入

| ID | 默认键 | 说明 |
|---|---|---|
| `tui.input.newLine` | `shift+enter` | 插入新行 |
| `tui.input.submit` | `enter` | 提交输入 |
| `tui.input.tab` | `tab` | Tab / 自动补全 |

### TUI 剪贴板

| ID | 默认键 | 说明 |
|---|---|---|
| `tui.input.copy` | `ctrl+c` | 复制选中 |
| `tui.editor.yank` | `ctrl+y` | 粘贴最近删除的文本 |
| `tui.editor.yankPop` | `alt+y` | 循环已删除文本 |
| `tui.editor.undo` | `ctrl+-` | 撤销 |

### 应用程序

| ID | 默认键 | 说明 |
|---|---|---|
| `app.interrupt` | `escape` | 取消/中断 |
| `app.clear` | `ctrl+c` | 清空编辑器 |
| `app.exit` | `ctrl+d` | 退出（编辑器为空时） |
| `app.suspend` | `ctrl+z` | 挂起到后台 |
| `app.editor.external` | `ctrl+g` | 在外部编辑器中打开 |
| `app.clipboard.pasteImage` | `ctrl+v` | 从剪贴板粘贴图像 |

### 会话

| ID | 默认键 | 说明 |
|---|---|---|
| `app.session.new` | 无 | 开始新会话 |
| `app.session.tree` | 无 | 打开会话树导航器 |
| `app.session.fork` | 无 | 分叉当前会话 |
| `app.session.resume` | 无 | 打开会话选择器 |

### 模型和思维

| ID | 默认键 | 说明 |
|---|---|---|
| `app.model.select` | `ctrl+l` | 打开模型选择器 |
| `app.model.cycleForward` | `ctrl+p` | 切换到下一个模型 |
| `app.model.cycleBackward` | `shift+ctrl+p` | 切换到上一个模型 |
| `app.thinking.cycle` | `shift+tab` | 循环切换 thinking level |
| `app.thinking.toggle` | `ctrl+t` | 折叠/展开 thinking block |

### 显示和消息队列

| ID | 默认键 | 说明 |
|---|---|---|
| `app.tools.expand` | `ctrl+o` | 折叠/展开工具输出 |
| `app.message.followUp` | `alt+enter` | 队列 follow-up 消息 |
| `app.message.dequeue` | `alt+up` | 恢复队列消息到编辑器 |

### 树导航

| ID | 默认键 | 说明 |
|---|---|---|
| `app.tree.foldOrUp` | `ctrl+left`、`alt+left` | 折叠分支段 |
| `app.tree.unfoldOrDown` | `ctrl+right`、`alt+right` | 展开分支段 |
| `app.tree.editLabel` | `shift+l` | 编辑节点标签 |
| `app.tree.filter.cycleForward` | `ctrl+o` | 循环树过滤器 |

## 自定义配置

创建 `~/.pi/agent/keybindings.json`：

```json
{
  "tui.editor.cursorUp": ["up", "ctrl+p"],
  "tui.editor.cursorDown": ["down", "ctrl+n"],
  "tui.editor.deleteWordBackward": ["ctrl+w", "alt+backspace"]
}
```

### Emacs 风格示例

```json
{
  "tui.editor.cursorUp": ["up", "ctrl+p"],
  "tui.editor.cursorDown": ["down", "ctrl+n"],
  "tui.editor.cursorLeft": ["left", "ctrl+b"],
  "tui.editor.cursorRight": ["right", "ctrl+f"],
  "tui.editor.cursorWordLeft": ["alt+left", "alt+b"],
  "tui.editor.cursorWordRight": ["alt+right", "alt+f"],
  "tui.editor.deleteCharForward": ["delete", "ctrl+d"],
  "tui.editor.deleteCharBackward": ["backspace", "ctrl+h"],
  "tui.input.newLine": ["shift+enter", "ctrl+j"]
}
```

### Vim 风格示例

```json
{
  "tui.editor.cursorUp": ["up", "alt+k"],
  "tui.editor.cursorDown": ["down", "alt+j"],
  "tui.editor.cursorLeft": ["left", "alt+h"],
  "tui.editor.cursorRight": ["right", "alt+l"],
  "tui.editor.cursorWordLeft": ["alt+left", "alt+b"],
  "tui.editor.cursorWordRight": ["alt+right", "alt+w"]
}
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
