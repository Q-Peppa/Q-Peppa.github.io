# Sessions（会话）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/sessions) 的中文翻译。仅供学习参考。

Pi 将会话保存为会话文件，**使你可以继续工作、从之前的回合分支和回访之前的路径**。

## 会话存储

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。每个会话是一个 JSONL 文件，具有树状结构。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并选择历史会话
pi --no-session        # 临时模式，不保存
pi --session <path|id> # 使用特定会话
pi --fork <path|id>    # 分叉会话
```

`/session` 命令显示当前会话文件、会话 ID、消息数、Token 和费用。

## 会话命令

| 命令 | 说明 |
|---|---|
| `/resume` | 浏览并选择历史会话 |
| `/new` | 开始新会话 |
| `/name <name>` | 设置会话显示名称 |
| `/session` | 显示会话信息 |
| `/tree` | 导航当前会话树 |
| `/fork` | 从之前的用户消息创建新会话 |
| `/clone` | 复制当前活跃分支到新会话 |
| `/compact [prompt]` | 总结较早的上下文 |
| `/export [file]` | 导出会话为 HTML |
| `/share` | 上传为私有 GitHub Gist |

## 恢复和删除会话

`/resume` 打开当前项目的交互式会话选择器，`pi -r` 在启动时打开。在选择器中：

- 搜索：直接输入
- Ctrl+P：切换路径显示
- Ctrl+S：切换排序模式
- Ctrl+N：过滤已命名会话
- Ctrl+R：重命名
- Ctrl+D：删除并确认

## 命名会话

```bash
/name Refactor auth module
```

命名后的会话在 `/resume` 和 `pi -r` 中更容易找到。

## 使用 `/tree` 分支

会话以树状结构存储。每个条目有 `id` 和 `parentId`，当前位置是活跃的叶节点。`/tree` 让你跳转到任意之前的节点并从那里继续。

```
├─ user: "Hello, can you help..."
│  └─ assistant: "Of course! I can..."
│     ├─ user: "Let's try approach A..."
│     │  └─ assistant: "For approach A..."
│     │     └─ user: "That worked..."  ← 当前活跃
│     └─ user: "Actually, approach B..."
│        └─ assistant: "For approach B..."
```

### 树操作键

| 按键 | 操作 |
|---|---|
| ↑/↓ | 导航可见条目 |
| ←/→ | 翻页 |
| Ctrl+←/Ctrl+→ | 折叠/展开或跳转分支段 |
| Shift+L | 设置或清除标签 |
| Enter | 选择条目 |
| Escape/Ctrl+C | 取消 |
| Ctrl+O | 循环过滤模式 |

### 选择行为

- **选择用户消息**：将叶节点移到消息父节点，消息文本放入编辑器，可编辑后重新提交（创建新分支）
- **选择非用户条目**：将叶节点移到该条目，编辑器清空，从该点继续
- **选择根用户消息**：重置为空对话，原始 Prompt 放入编辑器

## `/tree`、`/fork` 和 `/clone` 对比

| 功能 | `/tree` | `/fork` | `/clone` |
|---|---|---|---|
| 输出 | 同一会话文件 | 新会话文件 | 新会话文件 |
| 视图 | 完整树 | 用户消息选择器 | 当前活跃分支 |
| 典型用途 | 原地探索替代方案 | 从之前的 Prompt 开始新会话 | 在继续前复制当前工作 |

## 分支摘要

当 `/tree` 从一个分支切换到另一个分支时，Pi 可以总结被放弃的分支，并在新位置附加该摘要。

## 会话格式

会话文件是 JSONL 格式，包含消息条目、模型更改、thinking level 更改、标签、压缩记录、分支摘要和扩展条目。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
