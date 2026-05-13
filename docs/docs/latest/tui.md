# TUI Components（TUI 组件）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/tui) 的中文翻译。仅供学习参考。

TUI 组件系统用于在扩展和自定义工具中构建交互式终端 UI。来源：`@earendil-works/pi-tui`。

## 组件接口

所有组件实现三个方法：

- **`render(width)`** —— 返回字符串数组（每行一个）。**每行不能超过 `width`**
- **`handleInput?(data)`** —— 组件获得焦点时接收键盘输入
- **`invalidate()`** —— 清除缓存的渲染状态（主题变更时调用）

## Focusable 接口（IME 支持）

需要 IME 支持的组件（显示文本光标）应实现 `Focusable`。需要 `focused: boolean` 属性，并在光标位置前发射 `CURSOR_MARKER`。确保 IME 候选窗口出现在正确位置（中文、日文、韩文输入法）。

## 使用组件

在扩展中通过 `ctx.ui.custom()`：

```ts
const handle = ctx.ui.custom(myComponent);
// handle.requestRender() - 触发重新渲染
// handle.close() - 恢复正常 UI
```

在自定义工具中通过 `pi.ui.custom()`。

## 内置组件

从 `@earendil-works/pi-tui` 导入：

```ts
import { Text, Box, Container, Spacer, Markdown } from "@earendil-works/pi-tui";
```

- **Text** —— 多行文本，支持自动换行
- **Box** —— 带内边距和背景色的容器
- **Container** —— 垂直分组子组件
- **Spacer** —— 空垂直空间
- **Markdown** —— Markdown 渲染（带语法高亮）
- **Image** —— 在支持的终端中渲染图像

## 键盘输入

使用 `matchesKey()` 检测按键：

```ts
import { matchesKey, Key } from "@earendil-works/pi-tui";

handleInput(data: string) {
  if (matchesKey(data, Key.up)) { /* ... */ }
  if (matchesKey(data, Key.enter)) { /* ... */ }
  if (matchesKey(data, Key.escape)) { /* ... */ }
  if (matchesKey(data, Key.ctrl("c"))) { /* ... */ }
}
```

Key 标识符：`Key.enter`、`Key.escape`、`Key.tab`、`Key.space`、`Key.backspace`、`Key.up`、`Key.down`、`Key.left`、`Key.right`、`Key.ctrl("c")`、`Key.shift("tab")`、`Key.alt("left")`。

## 行宽规则

**关键规则**：`render()` 的每行不能超过 `width` 参数。

实用工具：
- `visibleWidth(str)` —— 获取忽略 ANSI 码的显示宽度
- `truncateToWidth(str, width)` —— 以可选省略号截断
- `wrapTextWithAnsi(str, width)` —— 保留 ANSI 码的自动换行

## 创建自定义组件

```ts
class MySelector {
  private items: string[];
  private selected = 0;
  private cachedLines?: string[];

  handleInput(data: string) {
    if (matchesKey(data, Key.up)) this.selected--;
    if (matchesKey(data, Key.down)) this.selected++;
    if (matchesKey(data, Key.enter)) this.onSelect?.(this.selected);
    if (matchesKey(data, Key.escape)) this.onCancel?.();
  }

  render(width: number): string[] {
    return this.items.map((item, i) =>
      truncateToWidth((i === this.selected ? "> " : "  ") + item, width)
    );
  }

  invalidate() { this.cachedLines = undefined; }
}
```

## 主题

使用 `theme.fg(color, text)` 设置前景色，`theme.bg(color, text)` 设置背景色。颜色分类：
- General：`text`、`accent`、`muted`、`dim`
- Status：`success`、`error`、`warning`
- Markdown：`mdHeading`、`mdLink`、`mdCode`
- Syntax：`syntaxComment`、`syntaxKeyword`、`syntaxString`

## 常见模式

- **Selection Dialog** —— 使用 `SelectList` + `DynamicBorder`
- **Async with Cancel** —— 使用 `BorderedLoader`
- **Settings/Toggles** —— 使用 `SettingsList`
- **Persistent Status** —— 使用 `ctx.ui.setStatus()`
- **Widgets** —— 使用 `ctx.ui.setWidget()` 在编辑器上方/下方
- **Custom Footer** —— 使用 `ctx.ui.setFooter()`
- **Custom Editor** —— 扩展 `CustomEditor`

## 性能

在可能时缓存渲染输出，状态变化时调用 `invalidate()` 和 `handle.requestRender()`。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
