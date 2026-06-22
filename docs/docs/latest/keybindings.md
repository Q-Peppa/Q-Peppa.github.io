# Keybindings（快捷键）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/keybindings) 的中文翻译。仅供学习参考。

所有键盘快捷键可通过 `~/.pi/agent/keybindings.json` 自定义。每个操作可绑定一个或多个按键。

配置文件使用 Pi 内部使用的相同命名空间快捷键 ID，扩展作者在 `keyHint()` 和注入的 `keybindings` 管理器中也使用这些 ID。

使用旧的非命名空间 ID（如 `cursorUp` 或 `expandTools`）的旧配置在启动时会自动迁移到命名空间 ID。

编辑 `keybindings.json` 后，运行 `/reload` 在 Pi 中应用更改，无需重启会话。

## 按键格式

格式：`modifier+key`，修饰键包括 `ctrl`、`shift`、`alt`（可组合），按键包括：

- **字母键**：`a-z`
- **数字键**：`0-9`
- **特殊键**：`escape`、`esc`、`enter`、`return`、`tab`、`space`、`backspace`、`delete`、`insert`、`clear`、`home`、`end`、`pageUp`、`pageDown`、`up`、`down`、`left`、`right`
- **功能键**：`f1`–`f12`
- **符号**：`` ` ``、`-`、`=`、`[`、`]`、`\`、`;`、`'`、`,`、`.`、`/`、`!`、`@`、`#`、`$`、`%`、`^`、`&`、`*`、`(`、`)`、`_`、`+`、`|`、`~`、`{`、`}`、`:`、`<`、`>`、`?`

修饰键组合示例：`ctrl+shift+x`、`alt+ctrl+x`、`ctrl+shift+alt+x`、`ctrl+1` 等。

## 所有操作

### TUI 编辑器光标移动

| ID                           | 默认键                             | 说明             |
| ---------------------------- | ---------------------------------- | ---------------- |
| `tui.editor.cursorUp`        | `up`                               | 光标上移         |
| `tui.editor.cursorDown`      | `down`                             | 光标下移         |
| `tui.editor.cursorLeft`      | `left`、`ctrl+b`                   | 光标左移         |
| `tui.editor.cursorRight`     | `right`、`ctrl+f`                  | 光标右移         |
| `tui.editor.cursorWordLeft`  | `alt+left`、`ctrl+left`、`alt+b`   | 光标左移一个单词 |
| `tui.editor.cursorWordRight` | `alt+right`、`ctrl+right`、`alt+f` | 光标右移一个单词 |
| `tui.editor.cursorLineStart` | `home`、`ctrl+a`                   | 移至行首         |
| `tui.editor.cursorLineEnd`   | `end`、`ctrl+e`                    | 移至行尾         |
| `tui.editor.jumpForward`     | `ctrl+]`                           | 向前跳转至字符   |
| `tui.editor.jumpBackward`    | `ctrl+alt+]`                       | 向后跳转至字符   |
| `tui.editor.pageUp`          | `pageUp`                           | 上翻页           |
| `tui.editor.pageDown`        | `pageDown`                         | 下翻页           |

### TUI 编辑器删除

| ID                              | 默认键                    | 说明             |
| ------------------------------- | ------------------------- | ---------------- |
| `tui.editor.deleteCharBackward` | `backspace`               | 删除前一个字符   |
| `tui.editor.deleteCharForward`  | `delete`、`ctrl+d`        | 删除后一个字符   |
| `tui.editor.deleteWordBackward` | `ctrl+w`、`alt+backspace` | 向前删除一个单词 |
| `tui.editor.deleteWordForward`  | `alt+d`、`alt+delete`     | 向后删除一个单词 |
| `tui.editor.deleteToLineStart`  | `ctrl+u`                  | 删除到行首       |
| `tui.editor.deleteToLineEnd`    | `ctrl+k`                  | 删除到行尾       |

### TUI 输入

| ID                  | 默认键                  | 说明           |
| ------------------- | ----------------------- | -------------- |
| `tui.input.newLine` | `shift+enter`、`ctrl+j` | 插入新行       |
| `tui.input.submit`  | `enter`                 | 提交输入       |
| `tui.input.tab`     | `tab`                   | Tab / 自动补全 |

### TUI Kill Ring

| ID                   | 默认键   | 说明                     |
| -------------------- | -------- | ------------------------ |
| `tui.editor.yank`    | `ctrl+y` | 粘贴最近删除的文本       |
| `tui.editor.yankPop` | `alt+y`  | 在 yank 后循环已删除文本 |
| `tui.editor.undo`    | `ctrl+-` | 撤销上次编辑             |

### TUI 剪贴板和选择

| ID                    | 默认键             | 说明           |
| --------------------- | ------------------ | -------------- |
| `tui.input.copy`      | `ctrl+c`           | 复制选中       |
| `tui.select.up`       | `up`               | 向上移动选择   |
| `tui.select.down`     | `down`             | 向下移动选择   |
| `tui.select.pageUp`   | `pageUp`           | 列表中向上翻页 |
| `tui.select.pageDown` | `pageDown`         | 列表中向下翻页 |
| `tui.select.confirm`  | `enter`            | 确认选择       |
| `tui.select.cancel`   | `escape`、`ctrl+c` | 取消选择       |

### 应用程序

| ID                         | 默认键                         | 说明                                       |
| -------------------------- | ------------------------------ | ------------------------------------------ |
| `app.interrupt`            | `escape`                       | 取消/中断                                  |
| `app.clear`                | `ctrl+c`                       | 清空编辑器                                 |
| `app.exit`                 | `ctrl+d`                       | 退出（编辑器为空时）                       |
| `app.suspend`              | `ctrl+z`（Windows 上无）       | 挂起到后台                                 |
| `app.editor.external`      | `ctrl+g`                       | 在外部编辑器打开（`$VISUAL` 或 `$EDITOR`） |
| `app.clipboard.pasteImage` | `ctrl+v`（Windows 为 `alt+v`） | 从剪贴板粘贴图像                           |

### 会话

| ID                              | 默认键           | 说明                            |
| ------------------------------- | ---------------- | ------------------------------- |
| `app.session.new`               | 无               | 开始新会话（`/new`）            |
| `app.session.tree`              | 无               | 打开会话树导航器（`/tree`）     |
| `app.session.fork`              | 无               | 分叉当前会话（`/fork`）         |
| `app.session.resume`            | 无               | 打开会话恢复选择器（`/resume`） |
| `app.session.togglePath`        | `ctrl+p`         | 切换路径显示                    |
| `app.session.toggleSort`        | `ctrl+s`         | 切换排序模式                    |
| `app.session.toggleNamedFilter` | `ctrl+n`         | 切换仅显示命名会话过滤器        |
| `app.session.rename`            | `ctrl+r`         | 重命名会话                      |
| `app.session.delete`            | `ctrl+d`         | 删除会话                        |
| `app.session.deleteNoninvasive` | `ctrl+backspace` | 查询为空时删除会话              |

### 模型和思维

| ID                        | 默认键         | 说明                     |
| ------------------------- | -------------- | ------------------------ |
| `app.model.select`        | `ctrl+l`       | 打开模型选择器           |
| `app.model.cycleForward`  | `ctrl+p`       | 切换到下一个模型         |
| `app.model.cycleBackward` | `shift+ctrl+p` | 切换到上一个模型         |
| `app.thinking.cycle`      | `shift+tab`    | 循环切换 thinking level  |
| `app.thinking.toggle`     | `ctrl+t`       | 折叠/展开 thinking block |

### 显示和消息队列

| ID                     | 默认键      | 说明                 |
| ---------------------- | ----------- | -------------------- |
| `app.tools.expand`     | `ctrl+o`    | 折叠/展开工具输出    |
| `app.message.followUp` | `alt+enter` | 队列 follow-up 消息  |
| `app.message.dequeue`  | `alt+up`    | 恢复队列消息到编辑器 |

### 树导航

| ID                              | 默认键                    | 说明                                           |
| ------------------------------- | ------------------------- | ---------------------------------------------- |
| `app.tree.foldOrUp`             | `ctrl+left`、`alt+left`   | 折叠当前分支段，或跳转到上一个段起始           |
| `app.tree.unfoldOrDown`         | `ctrl+right`、`alt+right` | 展开当前分支段，或跳转到下一个段起始或分支结束 |
| `app.tree.editLabel`            | `shift+l`                 | 编辑树节点上的标签                             |
| `app.tree.toggleLabelTimestamp` | `shift+t`                 | 切换树中标签时间戳显示                         |
| `app.tree.filter.default`       | `ctrl+d`                  | 设置树过滤器为默认视图                         |
| `app.tree.filter.noTools`       | `ctrl+t`                  | 切换隐藏工具结果的树过滤器                     |
| `app.tree.filter.userOnly`      | `ctrl+u`                  | 切换仅显示用户消息的树过滤器                   |
| `app.tree.filter.labeledOnly`   | `ctrl+l`                  | 切换仅显示带标签条目的树过滤器                 |
| `app.tree.filter.all`           | `ctrl+a`                  | 切换显示所有条目的树过滤器                     |
| `app.tree.filter.cycleForward`  | `ctrl+o`                  | 循环向前切换树过滤器                           |
| `app.tree.filter.cycleBackward` | `shift+ctrl+o`            | 循环向后切换树过滤器                           |

### Scoped Models 选择器

在 scoped models 选择器（通过 `/scoped-models` 打开）内使用。

| ID                          | 默认键     | 说明                                 |
| --------------------------- | ---------- | ------------------------------------ |
| `app.models.save`           | `ctrl+s`   | 将当前模型选择保存到设置             |
| `app.models.enableAll`      | `ctrl+a`   | 启用所有模型（或所有匹配当前搜索的） |
| `app.models.clearAll`       | `ctrl+x`   | 清除所有模型（或所有匹配当前搜索的） |
| `app.models.toggleProvider` | `ctrl+p`   | 切换当前 Provider 的所有模型         |
| `app.models.reorderUp`      | `alt+up`   | 将选中模型在循环顺序中上移           |
| `app.models.reorderDown`    | `alt+down` | 将选中模型在循环顺序中下移           |

## 自定义配置

创建 `~/.pi/agent/keybindings.json`：

```json
{
  "tui.editor.cursorUp": ["up", "ctrl+p"],
  "tui.editor.cursorDown": ["down", "ctrl+n"],
  "tui.editor.deleteWordBackward": ["ctrl+w", "alt+backspace"]
}
```

每个操作可以有一个按键或一个按键数组。用户配置覆盖默认值。

在原生 Windows 上，`app.suspend` 没有默认绑定，因为 Windows 终端不支持 Unix 作业控制。如果手动绑定，Pi 会显示状态消息而非挂起。在 WSL 中，正常的 Linux `ctrl+z`/`fg` 行为仍然适用。

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
