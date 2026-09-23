# 快捷键参考

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/keybindings) 的中文翻译。仅供学习参考。

Pi 暴露具名动作，例如 `app.session.new`，可以为它们分配快捷键。你可以在 Pi 的[用户配置](configuration.md#agent-directory)中修改默认分配，或为未分配的动作绑定按键。

运行 `/hotkeys` 可以查看主编辑器和应用当前生效的快捷键。

## 分配快捷键

创建 `<agent-dir>/keybindings.json`。agent 目录默认为 `~/.pi/agent`，详见 [Agent 目录](configuration.md#agent-directory)。

把每个动作标识符映射到一个按键或按键列表：

```json
{
  "app.session.new": "ctrl+shift+n",
  "app.session.tree": ["ctrl+shift+t", "alt+shift+t"]
}
```

配置的值会替换该动作的默认值。用空列表可以禁用某个动作的快捷键：

```json
{
  "tui.altScreen.pageUp": []
}
```

编辑文件后，运行 `/reload` 把改动应用到当前会话。

## 按键语法

按键写成 `modifier+key`。修饰键是 `ctrl`、`shift`、`alt` 和 `super`。可以组合修饰键。合法的按键有：

- **字母：** `a-z`
- **数字：** `0-9`
- **特殊：** `escape`、`esc`、`enter`、`return`、`tab`、`space`、`backspace`、`delete`、`insert`、`clear`、`home`、`end`、`pageUp`、`pageDown`、`up`、`down`、`left`、`right`
- **功能键：** `f1`-`f12`
- **符号：** `` ` ``、`-`、`=`、`[`、`]`、`\`、`;`、`'`、`,`、`.`、`/`、`!`、`@`、`#`、`$`、`%`、`^`、`&`、`*`、`(`、`)`、`_`、`+`、`|`、`~`、`{`、`}`、`:`、`<`、`>`、`?`

示例：`ctrl+shift+x`、`alt+ctrl+x`、`ctrl+shift+alt+x`、`super+k`、`ctrl+super+k` 和 `ctrl+1`。

`super` 绑定需要终端单独报告该修饰键，通常通过 Kitty 键盘协议。在不支持该协议的终端中它们可能不工作。

## 动作

### 终端 UI

#### 光标移动

| 快捷键 id                    | 默认值                             | 说明                           |
| ---------------------------- | ---------------------------------- | ------------------------------ |
| `tui.editor.cursorUp`        | `up`                               | 上移光标，在顶部浏览更早的历史 |
| `tui.editor.cursorDown`      | `down`                             | 下移光标，在底部浏览更新的历史 |
| `tui.editor.historyPrevious` | 无                                 | 选择上一条 Prompt 历史条目     |
| `tui.editor.historyNext`     | 无                                 | 选择下一条 Prompt 历史条目     |
| `tui.editor.cursorLeft`      | `left`、`ctrl+b`                   | 左移光标                       |
| `tui.editor.cursorRight`     | `right`、`ctrl+f`                  | 右移光标                       |
| `tui.editor.cursorWordLeft`  | `alt+left`、`ctrl+left`、`alt+b`   | 光标左移一个词                 |
| `tui.editor.cursorWordRight` | `alt+right`、`ctrl+right`、`alt+f` | 光标右移一个词                 |
| `tui.editor.cursorLineStart` | `home`、`ctrl+home`、`ctrl+a`      | 移到行首                       |
| `tui.editor.cursorLineEnd`   | `end`、`ctrl+end`、`ctrl+e`        | 移到行尾                       |
| `tui.editor.jumpForward`     | `ctrl+]`                           | 向前跳到某个字符               |
| `tui.editor.jumpBackward`    | `ctrl+alt+]`                       | 向后跳到某个字符               |
| `tui.editor.pageUp`          | `pageUp`、`ctrl+pageUp`            | 向上翻页                       |
| `tui.editor.pageDown`        | `pageDown`、`ctrl+pageDown`        | 向下翻页                       |

专用的历史动作无论光标位置都会浏览 Prompt 历史，并优先于使用同一按键的应用动作。

#### 文本编辑

| 快捷键 id                       | 默认值                                          | 说明                          |
| ------------------------------- | ----------------------------------------------- | ----------------------------- |
| `tui.editor.deleteCharBackward` | `backspace`                                     | 向后删除一个字符              |
| `tui.editor.deleteCharForward`  | `delete`、`ctrl+d`                              | 向前删除一个字符              |
| `tui.editor.deleteWordBackward` | `ctrl+w`、`alt+backspace`                       | 向后删除一个词                |
| `tui.editor.deleteWordForward`  | `alt+d`、`alt+delete`                           | 向前删除一个词                |
| `tui.editor.deleteToLineStart`  | `ctrl+u`                                        | 删除到行首                    |
| `tui.editor.deleteToLineEnd`    | `ctrl+k`                                        | 删除到行尾                    |
| `tui.editor.yank`               | `ctrl+y`                                        | 粘贴最近删除的文本            |
| `tui.editor.yankPop`            | `alt+y`                                         | yank 之后循环切换删除过的文本 |
| `tui.editor.undo`               | `ctrl+-`（Windows 为 `ctrl+z`；WSL 为 `alt+z`） | 撤销上次编辑                  |

#### 输入与选择

| 快捷键 id             | 默认值                  | 说明           |
| --------------------- | ----------------------- | -------------- |
| `tui.input.newLine`   | `shift+enter`、`ctrl+j` | 插入换行       |
| `tui.input.submit`    | `enter`                 | 提交输入       |
| `tui.input.tab`       | `tab`                   | Tab 或自动补全 |
| `tui.input.copy`      | `ctrl+c`                | 复制选区       |
| `tui.select.up`       | `up`                    | 上移选择       |
| `tui.select.down`     | `down`                  | 下移选择       |
| `tui.select.pageUp`   | `pageUp`                | 列表向上翻页   |
| `tui.select.pageDown` | `pageDown`              | 列表向下翻页   |
| `tui.select.confirm`  | `enter`                 | 确认选择       |
| `tui.select.cancel`   | `escape`、`ctrl+c`      | 取消选择       |

#### 全屏

在全屏模式下，这些动作控制转录，并优先于使用同一按键的编辑器动作。

| 快捷键 id                      | 默认值                                                            | 说明                       |
| ------------------------------ | ----------------------------------------------------------------- | -------------------------- |
| `tui.altScreen.pageUp`         | `pageUp`                                                          | 转录向上滚动一页           |
| `tui.altScreen.pageDown`       | `pageDown`                                                        | 转录向下滚动一页           |
| `tui.altScreen.halfPageUp`     | 无                                                                | 转录向上滚动半页           |
| `tui.altScreen.halfPageDown`   | 无                                                                | 转录向下滚动半页           |
| `tui.altScreen.lineUp`         | 无                                                                | 转录向上滚动一行           |
| `tui.altScreen.lineDown`       | 无                                                                | 转录向下滚动一行           |
| `tui.altScreen.previousPrompt` | `ctrl+shift+up`、`ctrl+up`（Windows 和 WSL 只有 `ctrl+up`）       | 跳到上一条标记的消息       |
| `tui.altScreen.nextPrompt`     | `ctrl+shift+down`、`ctrl+down`（Windows 和 WSL 只有 `ctrl+down`） | 跳到下一条标记的消息       |
| `tui.altScreen.search`         | `ctrl+shift+f`（Windows 和 WSL 为 `ctrl+f`）                      | 搜索已渲染的转录           |
| `tui.altScreen.searchNext`     | `enter`、`ctrl+g`                                                 | 搜索时选择下一个匹配项     |
| `tui.altScreen.searchPrevious` | `shift+enter`、`ctrl+shift+g`                                     | 搜索时选择上一个匹配项     |
| `tui.altScreen.searchClose`    | `escape`                                                          | 关闭转录搜索               |
| `tui.altScreen.top`            | `home`                                                            | 滚动到转录开头             |
| `tui.altScreen.bottom`         | `end`                                                             | 滚动到转录末尾并跟随新输出 |

### 应用

| 快捷键 id                  | 默认值                                | 说明                                                                                                      |
| -------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `app.interrupt`            | `escape`                              | 取消 / 中止                                                                                               |
| `app.clear`                | `ctrl+c`                              | 清空编辑器（第一次）/ 退出（第二次）                                                                      |
| `app.exit`                 | `ctrl+d`                              | 退出（编辑器为空时）                                                                                      |
| `app.suspend`              | `ctrl+z`（Windows 上无默认值）        | 挂起到后台                                                                                                |
| `app.editor.external`      | `ctrl+g`                              | 在外部编辑器中打开（`externalEditor`、`$VISUAL`、`$EDITOR`、Windows 上的 Notepad，或其他平台上的 `nano`） |
| `app.clipboard.pasteImage` | `ctrl+v`（Windows 和 WSL 为 `alt+v`） | 从剪贴板粘贴图片或文本                                                                                    |

在原生 Windows 上，`app.suspend` 没有默认值，因为 Windows 终端不支持 Unix 作业控制。如果你手动分配它，Pi 会显示状态消息而不是挂起。WSL 使用正常的 `ctrl+z` 和 `fg` 行为。

### 会话

| 快捷键 id                       | 默认值           | 说明                            |
| ------------------------------- | ---------------- | ------------------------------- |
| `app.session.new`               | 无               | 开始新会话（`/new`）            |
| `app.session.tree`              | 无               | 打开会话树导航器（`/tree`）     |
| `app.session.fork`              | 无               | Fork 当前会话（`/fork`）        |
| `app.session.resume`            | 无               | 打开会话恢复选择器（`/resume`） |
| `app.session.togglePath`        | `ctrl+p`         | 切换路径显示                    |
| `app.session.toggleSort`        | `ctrl+s`         | 切换排序模式                    |
| `app.session.toggleNamedFilter` | `ctrl+n`         | 切换仅命名过滤                  |
| `app.session.rename`            | `ctrl+r`         | 重命名会话                      |
| `app.session.delete`            | `ctrl+d`         | 删除会话                        |
| `app.session.deleteNoninvasive` | `ctrl+backspace` | 查询为空时删除会话              |

### 模型与 Thinking

| 快捷键 id                 | 默认值                                      | 说明                                     |
| ------------------------- | ------------------------------------------- | ---------------------------------------- |
| `app.model.select`        | `ctrl+l`                                    | 打开模型选择器                           |
| `app.model.cycleForward`  | `ctrl+p`                                    | 循环到下一个模型                         |
| `app.model.cycleBackward` | `shift+ctrl+p`（Windows 和 WSL 为 `alt+p`） | 循环到上一个模型                         |
| `app.models.save`         | `ctrl+s`                                    | 把选中的默认模型或范围模型配置保存到设置 |
| `app.thinking.cycle`      | `shift+tab`                                 | 循环 thinking level                      |
| `app.thinking.save`       | `ctrl+s`                                    | 把当前 thinking level 保存到设置         |
| `app.thinking.toggle`     | `ctrl+t`                                    | 折叠或展开 thinking 块                   |

### 显示与消息队列

| 快捷键 id              | 默认值                                    | 说明                                                                                                                          |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `app.tools.expand`     | `ctrl+o`                                  | 折叠或展开工具输出                                                                                                            |
| `app.message.copy`     | `ctrl+x`                                  | 在 `/tree` 中复制选中的消息；全屏模式下当 `fullscreenCopyOnSelect` 为 `false` 时复制活动选区；否则复制最后一条 assistant 消息 |
| `app.message.followUp` | `alt+enter`（Windows 和 WSL 为 `ctrl+q`） | 排队 follow-up 消息                                                                                                           |
| `app.message.dequeue`  | `alt+up`（Windows 和 WSL 为 `alt+q`）     | 把排队消息恢复到编辑器                                                                                                        |

### 树导航

| 快捷键 id                       | 默认值                    | 说明                                       |
| ------------------------------- | ------------------------- | ------------------------------------------ |
| `app.tree.foldOrUp`             | `ctrl+left`、`alt+left`   | 折叠当前分支段，或跳到上一段起点           |
| `app.tree.unfoldOrDown`         | `ctrl+right`、`alt+right` | 展开当前分支段，或跳到下一段起点或分支末尾 |
| `app.tree.editLabel`            | `shift+l`                 | 编辑所选树节点的标签                       |
| `app.tree.toggleLabelTimestamp` | `shift+t`                 | 在树中切换标签时间戳                       |
| `app.tree.filter.default`       | `ctrl+d`                  | 把树过滤器设为默认视图                     |
| `app.tree.filter.noTools`       | `ctrl+t`                  | 切换隐藏工具结果的树过滤器                 |
| `app.tree.filter.userOnly`      | `ctrl+u`                  | 切换只显示用户消息的树过滤器               |
| `app.tree.filter.labeledOnly`   | `ctrl+l`                  | 切换只显示带标签条目的树过滤器             |
| `app.tree.filter.all`           | `ctrl+a`                  | 切换显示所有条目的树过滤器                 |
| `app.tree.filter.cycleForward`  | `ctrl+o`                  | 向前循环树过滤器                           |
| `app.tree.filter.cycleBackward` | `shift+ctrl+o`            | 向后循环树过滤器                           |

### 范围模型选择器

在范围模型选择器中使用（通过 `/scoped-models` 打开）。

| 快捷键 id                   | 默认值     | 说明                                 |
| --------------------------- | ---------- | ------------------------------------ |
| `app.models.enableAll`      | `ctrl+a`   | 启用所有模型（或当前搜索匹配的全部） |
| `app.models.clearAll`       | `ctrl+x`   | 清空所有模型（或当前搜索匹配的全部） |
| `app.models.toggleProvider` | `ctrl+p`   | 切换当前 Provider 的所有模型         |
| `app.models.reorderUp`      | `alt+up`   | 在循环顺序中把所选模型上移           |
| `app.models.reorderDown`    | `alt+down` | 在循环顺序中把所选模型下移           |

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
