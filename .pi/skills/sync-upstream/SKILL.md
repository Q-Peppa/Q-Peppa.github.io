---
name: sync-upstream
description: >-
  同步源站 pi.dev 最新变更到中文翻译站，包括：更新新闻页面（从 CHANGELOG
  提取版本发布记录）、翻译审核（对比文档完整性、内容同步、翻译质量检查）。
  适用于本 Pi 中文文档站点的日常同步维护。
---

# 同步源站（Sync Upstream）

对翻译站（当前项目）与 `../pi-repo`（源站英文文档）进行双向同步，涵盖**新闻页面更新**和**翻译文档同步与审核**。

> **目录约定**：本 Skill 假设 `pi-repo` 与翻译站是同级目录。
> 如果你的布局不同，请调整 `../pi-repo` 为实际相对路径。

---

## 全局目录约定

| 项目            | 路径                                                        |
| --------------- | ----------------------------------------------------------- |
| 翻译站根目录    | `.`（当前项目根目录）                                       |
| 翻译站文档      | `./docs/docs/latest/`                                       |
| 翻译站新闻页    | `./docs/news.md`                                            |
| 翻译站配置      | `./rspress.config.ts`                                       |
| 翻译站图片      | `./docs/public/images/`                                     |
| 源站根目录      | `../pi-repo`                                                |
| 源站文档        | `../pi-repo/packages/coding-agent/docs/`                    |
| 源站图片        | `../pi-repo/packages/coding-agent/docs/images/`             |
| 源站 git remote | `https://github.com/earendil-works/pi.git`（`origin/main`） |

源站各包 CHANGELOG：

| 包           | 路径                                            |
| ------------ | ----------------------------------------------- |
| coding-agent | `../pi-repo/packages/coding-agent/CHANGELOG.md` |
| ai           | `../pi-repo/packages/ai/CHANGELOG.md`           |
| agent        | `../pi-repo/packages/agent/CHANGELOG.md`        |
| tui          | `../pi-repo/packages/tui/CHANGELOG.md`          |

---

## 前置：拉取源站最新代码

> 源站是完全克隆（非浅克隆），每次操作前先 `git pull` 拉取最新内容。

### 第 0 步：检查仓库工作区状态（必做，硬约束）

> ⚠️ **本步骤在任何 `git pull` / `git commit` / `git push` 之前必须执行。**
> 脏工作区会导致：源站 rebase 失败、翻译站 commit 污染、推送内容与预期不符等事故。

需要检查**两个仓库**（不要遗漏任何一个）：

| 仓库   | 路径         | 检查原因                                       |
| ------ | ------------ | ---------------------------------------------- |
| 翻译站 | `.`          | 后续要 `commit` + `push`，脏状态会污染 commit  |
| 源站   | `../pi-repo` | 后续要 `pull --rebase`，脏状态会让 rebase 失败 |

#### 检测脚本

```bash
check_clean() {
  local repo_name="$1"
  local repo_path="$2"
  local dirty=$(git -C "$repo_path" status --porcelain 2>/dev/null)
  if [ -n "$dirty" ]; then
    echo "⚠️ $repo_name 仓库脏（$repo_path）："
    echo "$dirty" | sed 's/^/    /'
    return 1
  else
    echo "✅ $repo_name 仓库干净"
    return 0
  fi
}

DIRTY=0
check_clean "翻译站" "." || DIRTY=1
check_clean "源站" "../pi-repo" || DIRTY=1
[ $DIRTY -eq 0 ] && echo "✅ 两个仓库都干净，继续执行" || echo "❌ 检测到脏仓库，必须处理后才能继续"
```

#### 检测到脏仓库时：AI 必须停下并询问用户

**严禁**以下 4 种行为：

1. ❌ 默默 `git stash` 而不告知用户
2. ❌ 默默 `git reset --hard`（可能毁掉用户工作）
3. ❌ 忽略脏状态继续 `git pull`（会 rebase 失败）
4. ❌ 忽略脏状态继续 `git commit -a`（会污染 commit）

**正确做法**：AI 调用 `ask_user_question` 工具，**每个脏仓库独立询问一次**（不要把两个仓库合并问，因为它们的修改可能语义完全不同）。

**问题模板**：

- 问题：`{翻译站 / 源站} 仓库有 N 个未提交修改，如何处理？`
- 选项 1（推荐）：**stash 暂存** — 执行 `git stash push -u -m "sync-upstream: pre-sync stash"`，同步完成后用 `git stash pop` 恢复
- 选项 2：**放弃修改** — 执行 `git reset --hard HEAD` + `git clean -fd`，**不可恢复**
- 选项 3：**退出** — 停止 skill 执行，由用户手动处理

**示例调用**（翻译站脏时）：

```
ask_user_question(
  questions: [{
    question: "翻译站仓库有 1 个未提交修改（pnpm-workspace.yaml），如何处理？",
    header: "脏仓库",
    options: [
      { label: "stash 暂存（推荐）", description: "执行 git stash push -u，同步完成后用 git stash pop 恢复" },
      { label: "放弃修改", description: "执行 git reset --hard HEAD + git clean -fd，不可恢复" },
      { label: "退出", description: "停止 skill 执行，由用户手动处理" }
    ]
  }]
)
```

**如果用户选择"退出"**：AI 立即停止执行，输出"已退出，请手动处理脏工作区后重新运行 skill"，不进入后续步骤。

**如果用户选择"stash"或"放弃"**：执行对应命令后**重新运行第 0 步的检测脚本**，确认返回 ✅ 后才进入下一步。

```bash
cd ../pi-repo
git pull --rebase
```

### 如果 `git pull` 报错

可能是本地做了修改导致冲突，先重置再拉：

```bash
cd ../pi-repo
git stash
git pull --rebase
```

### 检查是否有更新

```bash
cd ../pi-repo
git log --oneline HEAD..origin/main 2>/dev/null | head -5
```

如果输出为空，说明已经是最新：

> ✅ 源站已经是最新版本，无需任何操作。

如果有输出，继续以下步骤。

---

## 0. 同步范围探测（自动）

在执行 A 或 B 之前，**先自动算出"自上次同步以来，源站到底改了什么"**，避免人肉翻 `git log`。

### 0.1 建立同步基线

约定：翻译站的同步 commit 以 `sync:` 开头（参见末尾"提交并推送"）。用上一条 `sync:` commit 作为本次同步的起点。

```bash
# 在翻译站查找上一条 sync: 提交
cd .
LAST_SYNC=$(git log --oneline --grep="^sync:" -1 --format="%H" 2>/dev/null)

if [ -z "$LAST_SYNC" ]; then
  # 首次同步：回退到源站最近一个发布版本对应的 commit
  cd ../pi-repo
  LAST_SYNC=$(git log --oneline --grep="^Release v" -1 --format="%H" 2>/dev/null)
  cd ..
  echo "⚠️ 未找到历史 sync commit，使用源站最近发布版本作为基线: $LAST_SYNC"
else
  echo "✅ 上次同步基线: $LAST_SYNC"
fi
```

### 0.2 列出本次同步的源站变更

```bash
cd ../pi-repo
SINCE="$LAST_SYNC"

echo ""
echo "=== 自基线以来的源站 commit ==="
git log --oneline ${SINCE}..HEAD

echo ""
echo "=== docs/ 变更文件（影响 B 翻译同步） ==="
git diff --stat ${SINCE}..HEAD -- packages/coding-agent/docs/

echo ""
echo "=== CHANGELOG 变更文件（影响 A 新闻同步） ==="
git diff --stat ${SINCE}..HEAD -- packages/*/CHANGELOG.md

echo ""
echo "=== 图片资产变更 ==="
git diff --stat ${SINCE}..HEAD -- packages/coding-agent/docs/images/
```

**判定标准：**

- `docs/` 有变更 → 走 B 步骤，重点对比变更文件
- `CHANGELOG.md` 有变更且**含已发布版本** → 走 A 步骤，提取新版本写入 news.md
- `images/` 有变更 → 复制到翻译站 `./docs/public/images/`
- 全部为空 → ✅ 源站已与翻译站同步，直接进入"构建验证"

### 0.3 提取 CHANGELOG 中"自基线以来"的新增已发布版本

注意：**只输出 `[Unreleased]` 之后、下一个未发布版本之前**的所有带日期的 `## [x.y.z] - YYYY-MM-DD`。

```bash
cd ../pi-repo
for pkg in coding-agent ai agent tui; do
  file="packages/$pkg/CHANGELOG.md"
  echo "=== $pkg ==="
  awk '
    /^## \[Unreleased\]/ { in_unrel=1; next }
    in_unrel && /^## \[/ { in_unrel=0 }
    !in_unrel && /^## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}/ { print }
  ' "$file"
  echo ""
done
```

将输出的版本号集合交给 A 步骤。**输出为空说明无新发布版本，跳过 A。**

---

## A. 更新新闻页面（Update News）

从各包 CHANGELOG 提取新增版本记录，写入 `docs/news.md`。

> ⚠️ **不要写入 `[Unreleased]` 区的条目**
>
> CHANGELOG 顶部的 `[Unreleased]` 区是**尚未发布的变更**，`docs/news.md` 只反映**已发布**版本。
>
> | 标题形态                   | 是否写入 news.md            |
> | -------------------------- | --------------------------- |
> | `## [Unreleased]`          | ❌ 跳过（未发布）           |
> | `## [0.78.0] - 2026-05-29` | ✅ 写入（含发布日期）       |
> | `## [0.78.0]`（无日期）    | ⚠️ 视为已发布，谨慎核对日期 |
>
> **如何判断"已发布"**：源站 git tag（如 `v0.78.0`）存在 + CHANGELOG 该版本有日期。三者缺一则视为未发布。
>
> Unreleased 条目仅作为"待发布预告"参考，不出现在公开新闻中——下一版发布时再统一提取。

### 第 1 步：对比版本差异

```bash
# 查看最新版本
head -30 ../pi-repo/packages/coding-agent/CHANGELOG.md

# 对比其他子包
head -15 ../pi-repo/packages/ai/CHANGELOG.md
head -15 ../pi-repo/packages/agent/CHANGELOG.md
head -15 ../pi-repo/packages/tui/CHANGELOG.md
```

### 第 2 步：提取新增版本的变更内容

```bash
# 一次性提取指定版本的变更（示例：0.75.5）
for pkg in coding-agent ai agent tui; do
  file="../pi-repo/packages/$pkg/CHANGELOG.md"
  echo "=== $pkg ==="
  awk -v ver="0.75.5" '
    $0 ~ "^## \\[" ver "\\]" { found=1; next }
    found && /^## \[/ { found=0; next }
    found { print }
  ' "$file"
  echo ""
done
```

### 第 3 步：翻译并写入 news.md

在 `docs/news.md` 开头按版本号降序插入新版本条目。如果文件已有 `# 新闻` 标题，直接插入其后；如果文件没有标题结构，先写入标题再插入。

**如果 news.md 是全新的（或者内容是自动生成的）：**

写入完整格式：

```markdown
# 新闻

> Pi Coding Agent 及其子包的版本发布记录。

## v{版本号}（{日期}）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **{功能标题}** — {功能描述}。

新增

- {新增条目描述}（[#{issue号}](https://github.com/earendil-works/pi-mono/pull/{issue号})，感谢 [@作者](https://github.com/作者)）。

变更

- {变更描述}。

修复

- {修复描述}（[#{issue号}](https://github.com/earendil-works/pi/issues/{issue号})）。

</details>

<details>
<summary><strong>Pi TUI</strong></summary>

变更

- {变更描述}。

修复

- {修复描述}。

</details>
```

**如果 news.md 已有内容：** 找到 `# 新闻` 标题或第一个 `## v` 版本标题，在其前面插入新版本条目，保持版本号降序。

**翻译对照表：**

| 英文             | 中文       |
| ---------------- | ---------- |
| New Features     | 新功能     |
| Added            | 新增       |
| Changed          | 变更       |
| Fixed            | 修复       |
| Removed          | 移除       |
| Breaking Changes | 不兼容变更 |
| Deprecated       | 弃用       |
| Security         | 安全       |

**链接处理规则：**

写入 `news.md` 时，按下表转换源站链接形态：

| 源站链接形态                                          | 翻译站链接                                                   | 备注                                     |
| ----------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `usage.md`                                            | `/docs/latest/usage`                                         | 站内同级文件                             |
| `extensions.md`                                       | `/docs/latest/extensions`                                    | 同上                                     |
| `extensions.md#overlay-options`                       | `/docs/latest/extensions#overlay-options`                    | ⚠️ **必须保留锚点**，不能丢              |
| `themes.md#dark-theme`                                | `/docs/latest/themes#dark-theme`                             | 同上                                     |
| `tui.md#overlay-focus`                                | `/docs/latest/tui#overlay-focus`                             | 同上                                     |
| `../README.md`                                        | `https://github.com/earendil-works/pi/blob/main/README.md`   | 仓库根 README 改为 GitHub 绝对 URL       |
| `docs/foo.md`                                         | `https://github.com/earendil-works/pi/blob/main/docs/foo.md` | `docs/` 前缀相对链接改为 GitHub 绝对 URL |
| `https://github.com/earendil-works/pi/issues/1234`    | （原样保留）                                                 | Issue 链接                               |
| `https://github.com/earendil-works/pi-mono/pull/1234` | （原样保留）                                                 | PR 链接（注意旧仓库 `pi-mono`）          |

**最容易出错的 3 个点：**

1. 带锚点的相对链接 → **锚点 + 文件名都要保留**（最常见丢失）
2. 旧仓库 `pi-mono` 链接 → 保留 `pi-mono`，不要改成 `pi`
3. `../README.md` → 不要变成 `/docs/latest/README`，必须是 GitHub URL

---

## B. 翻译同步与审核（Translation Sync & Review）

对比源站与翻译站文档，同步新增/修改内容，审核翻译质量。

### 第 1 步：列出文件清单

```bash
# 源站文档列表
ls -1 ../pi-repo/packages/coding-agent/docs/*.md | xargs -I{} basename {} | sort

# 翻译站文档列表
ls -1 ./docs/docs/latest/*.md \
  ./docs/docs/latest/*.mdx 2>/dev/null \
  | xargs -I{} basename {} | sort
```

**检查要点：**

- 源站有的文件，翻译站是否有对应的翻译
- 翻译站是否有额外文件（如 `cdn-setup.md`）
- 文件名差异（`.md` vs `.mdx`）
- 图片文件是否已同步

### 第 2 步：行数对比

```bash
# 源站行数
echo "=== 源站 ==="
wc -l ../pi-repo/packages/coding-agent/docs/*.md | sort -n

echo ""
echo "=== 翻译站 ==="
wc -l ./docs/docs/latest/*.md \
  ./docs/docs/latest/*.mdx 2>/dev/null | sort -n
```

**检查要点：**

- 行数相差很大的文件（>20 行差异），标记为需要深入对比
- 翻译站明显行数更多的——可能是增加了增强内容（表格、说明）
- 翻译站明显行数更少的——可能是内容缺失或翻译省略

### 第 3 步：逐文件内容比对

对行数差异大的文件以及以下关键文件进行内容比对：

- `index.md / index.mdx` —— 文档入口
- `quickstart.md / quickstart.mdx` —— 新手入门
- `usage.md` —— 日常使用
- `settings.md` —— 配置
- `extensions.md` —— 扩展（最大文件，最易出错）
- `tui.md` —— TUI 组件
- `rpc.md` —— RPC 模式
- `sdk.md` —— SDK

**比对方法：**

1. 用 `read` 工具同时读取源站和翻译站的对应文件
2. 逐段对比：
   - 标题层级是否对应
   - 列表项是否齐全
   - 代码示例是否一致（代码不应被翻译）
   - 链接是否更新（翻译站内部链接格式可能不同）
   - 表格内容是否完整
   - TypeScript 类型定义是否原样保留

### 第 4 步：翻译质量审核

#### 4.1 术语一致性

| 英文       | 期望的中文                           |
| ---------- | ------------------------------------ |
| extension  | 扩展                                 |
| skill      | Skill（保持英文，首字母大写）或 技能 |
| provider   | Provider（保持英文）                 |
| prompt     | Prompt（保持英文）                   |
| thinking   | thinking（保持英文小写）             |
| token      | Token（首字母大写）                  |
| steering   | steering（保持英文小写）             |
| follow-up  | follow-up（保持英文）                |
| compaction | 压缩                                 |
| session    | 会话                                 |
| keybinding | 快捷键                               |
| theme      | 主题                                 |
| tool call  | tool call（保持英文）或 工具调用     |
| command    | 命令                                 |

#### 4.2 机器翻译痕迹

检查以下常见问题：

- 「的、地、得」使用不当
- 长定语不切分（如「通过……的……」结构套叠）
- 被动语态直译（应转为主动语态）
- 英文句式直译（如 "This means..." → 不应直接为 "这意味着..."）
- 主语缺失或不当的 "It is..." 直译
- 冠词（the, a, an）被生硬地翻译为「这个」、「一个」

#### 4.3 代码/示例保护

确认以下内容未被翻译：

- 代码块内的所有文本
- 命令行示例（`bash` 代码块）
- 文件路径
- 环境变量名
- JSON 配置示例中的键名
- TypeScript 类型定义
- 终端输出

#### 4.4 链接和引用

检查：

- 站内链接格式是否正确（翻译站可能使用 `/docs/latest/xxx` 而非 `xxx.md`）
- 外部链接是否仍指向正确的 GitHub 地址
- 图片路径是否有效

### 第 5 步：同步修改

对于确认需要同步的内容：

1. 用 `edit` 工具更新翻译站文件
2. 如果是新增文件，用 `write` 工具创建
3. 如需新增或修改图片：
   - 从 `../pi-repo/packages/coding-agent/docs/images/` 复制到 `./docs/public/images/`

---

## 最终：构建验证

修改完成后，务必构建验证：

```bash
cd .
pnpm run build
```

确保无死链接错误，构建产物更新正常。

---

## 最后：提交并推送

构建验证通过后，将变更提交并推送到远程仓库：

```bash
git add -A
git commit -m "sync: 同步源站文档更新"
git push
```

如有更具体的变更内容，建议编写更有意义的 commit message：

```bash
git add -A
git commit
# 在编辑器中编写详细的 commit message
git push
```

---

## 工作流快捷键

| 只看这个   | 运行以下                                                      |
| ---------- | ------------------------------------------------------------- |
| 只更新新闻 | 检查工作区 → 前置拉取 → 0 探测 → A 部分 → 构建验证 → 提交推送 |
| 只审核翻译 | 检查工作区 → 前置拉取 → 0 探测 → B 部分 → 构建验证 → 提交推送 |
| 全部同步   | 检查工作区 → 前置拉取 → 0 探测 → A → B → 构建验证 → 提交推送  |

> **工作区检查不可跳过**：如果任一仓库脏，必须先按"第 0 步"处理（stash / 放弃 / 退出），不处理不能继续。
