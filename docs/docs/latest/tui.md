# 终端 UI

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/tui) 的中文翻译。仅供学习参考。

`@earendil-works/pi-tui` 提供 Pi 使用的终端组件系统。当内置对话框、通知、状态文本和 widget 不足以支撑所需的交互时，扩展会使用它。

请从[扩展](extensions.md#interact-with-the-user)的 `ctx.ui` 方法入手。只有当 UI 需要自己的渲染、键盘或鼠标输入、焦点、布局或生命周期时，才构建自定义组件。

## 选择集成点

| 需求                         | 使用                                                    |
| ---------------------------- | ------------------------------------------------------- |
| 选择、确认、输入或多行编辑器 | `ctx.ui.select()`、`confirm()`、`input()` 或 `editor()` |
| 非阻塞反馈                   | `ctx.ui.notify()` 或 `setStatus()`                      |
| 编辑器附近的常驻内容         | `ctx.ui.setWidget()`                                    |
| 替换头部、页脚或编辑器       | 对应的 `ctx.ui` 组件工厂                                |
| 临时交互界面或 overlay       | `ctx.ui.custom()`                                       |
| 工具或会话条目的自定义渲染   | 扩展渲染器                                              |

这些 API 会在需要时收到 Pi 当前生效的主题和快捷键。不要在扩展内再创建一个终端渲染器。

## 了解组件模型

组件按可用宽度渲染一个终端行数组。它可以选择性地处理键盘和鼠标输入，并且在自身状态或依赖主题的内容变化时，必须让缓存输出失效。

每个渲染出的行都必须落在给定宽度之内。请测量可见的终端列，而不是字符串长度，因为 ANSI 转义序列、宽字符、emoji 和组合字符都会改变显示宽度。

请使用 `visibleWidth()`、`truncateToWidth()`、`sliceByColumn()` 和 `wrapTextWithAnsi()`，而不要自己实现终端宽度处理。Pi 在每一行之后都会重置样式和超链接，所以请在每个渲染行上重新应用样式。

修改组件状态之后，让受影响的组件失效，并调用注入的 `tui.requestRender()`。TUI 会合并渲染请求并更新终端。

## 组合内置组件

该包包含用于常见布局和控件的组件：

- `Text`、`Markdown`、`Image` 和 `TruncatedText` 渲染内容。
- `Container`、`VStack`、`HStack`、`Box` 和 `Spacer` 组合布局。
- `Input` 和 `Editor` 接受文本。
- `SelectList` 和 `SettingsList` 实现可搜索的选择和设置流程。
- `ScrollView` 提供有界的可滚动视口。
- `Loader` 和 `CancellableLoader` 报告进行中的工作。
- `MouseRegion` 在另一个组件周围添加指针行为。

请优先使用这些组件，而不是重新实现选择、滚动、文本编辑或宽度处理。扩展示例展示了如何把它们与 Pi 的边框和主题组合起来。

## 处理键盘输入和焦点

终端键盘输入请使用 `matchesKey()` 和 `Key`。解析器会考虑受支持的终端协议和按键修饰键。扩展组件应当使用注入的 `KeybindingsManager` 处理可配置的应用动作。

显示文本光标的组件应当实现 `Focusable`，并紧挨它的可视光标放置 `CURSOR_MARKER`。TUI 用该标记为输入法定位硬件光标。

包裹 `Input` 或 `Editor` 的容器必须把它的 `focused` 状态传播给该子组件。没有传播时，中文、日文、韩文等输入法的候选窗口可能出现在错误的屏幕位置。

替换主编辑器时，请扩展 Pi 的 `CustomEditor`。它会保留应用快捷键和 Agent 控制。

请把你编辑器不拥有的按键转发给基础实现，并通过清空自定义编辑器工厂来恢复默认行为。

## 处理鼠标输入

全屏模式把规范化后的鼠标事件路由到组件。处理器可以标记事件已处理、捕获拖拽序列、请求焦点或请求渲染。

未处理的滚轮事件会滚动最近的 `ScrollView`。未处理的主键拖拽仍可用于转录选择。OSC 8 链接优先于包裹它的点击区域。

常规模式把鼠标输入留给终端，因为终端拥有回滚缓冲区。即使全屏鼠标输入可用，也要为每种交互设计键盘路径。

## 使用自定义界面和 overlay

`ctx.ui.custom()` 临时把交互区域的控制权交给一个组件，并在该组件调用提供的完成回调时兑现。

传入 `overlay: true` 会在已有内容之上绘制。Overlay 选项控制尺寸、锚点、偏移、边距和响应式可见性。交互仍在进行时，overlay 句柄可以通过 `setHidden()` 改变焦点，或临时隐藏和显示 overlay。

有焦点的 overlay 在普通渲染之间保持输入所有权。如果另一个组件应当在 overlay 仍然可见时接收输入，请通过句柄显式释放或重定向焦点。

请把每个自定义组件实例视为属于一次交互。再次开始该交互时创建新实例。

用传给组件工厂的完成回调结束交互。它会兑现 `ctx.ui.custom()` 的 Promise 并释放该组件。不要对 `ctx.ui.custom()` 创建的 overlay 调用 `OverlayHandle.hide()`。

定位、堆叠、焦点、响应式可见性和动画行为见 [`overlay-qa-tests.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/overlay-qa-tests.ts)。

## 正确应用主题

请使用传给扩展或组件回调的主题。主题辅助函数会为 accent、muted text、success、warnings、errors、工具输出和 Markdown 等语义色生成 ANSI 样式字符串。

除非 `invalidate()` 会重建它们，否则不要长期保存带主题颜色的字符串。主题变化会清空渲染缓存，但无法移除已嵌入应用状态的旧 ANSI 颜色。

渲染期间求值的主题回调不需要特殊重建。无状态组件也可以在每次渲染时计算带主题的输出。

用[主题](themes.md)创建终端配色。渲染应当匹配当前应用主题的 Markdown 时，使用 Pi 的 `getMarkdownTheme()`。

## 保持渲染响应迅速

渲染运行在交互路径上。请按宽度和内容缓存开销大的布局和高亮计算，并在 `invalidate()` 中清空该缓存。

请让默认视图保持紧凑，通过展开或专用界面揭示细节。对于自定义工具渲染，请处理部分结果，并在能安全更新时复用之前的组件。

诊断渲染问题时，用 `PI_TUI_WRITE_LOG` 捕获原始 ANSI 流。请测试窄宽度、宽字符、resize 事件、主题变化、焦点切换，以及常规和全屏两种模式。

## 示例与源码

已检入的扩展示例覆盖了主要模式：

- [`preset.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/preset.ts) 和 [`tools.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/tools.ts) 使用选择列表和设置列表。
- [`qna.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/qna.ts) 使用可取消的异步 UI。
- [`modal-editor.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/modal-editor.ts) 替换编辑器。
- [`custom-footer.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/custom-footer.ts) 替换页脚。
- [`widget-placement.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/widget-placement.ts) 在编辑器周围放置常驻内容。
- [`doom-overlay/`](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions/doom-overlay/) 演示持续渲染的 overlay。

公开导出定义在 [`packages/tui/src/index.ts`](https://github.com/earendil-works/pi/blob/main/packages/tui/src/index.ts)。扩展生命周期、状态、工具、事件和模式行为见[扩展](extensions.md)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
