---
name: sync-upstream
description: >-
  同步源站 pi.dev 最新变更到中文翻译站，包括：更新新闻页面（从 CHANGELOG
  提取版本发布记录）、翻译审核（对比文档完整性、内容同步、翻译质量检查）。
  适用于本 Pi 中文文档站点的日常同步维护。
---

# 同步源站（Sync Upstream）

翻译站（当前项目）与 `../pi-repo`（源站）同步，涵盖**新闻页面更新**和**翻译文档同步**。

---

## 目录约定

| 项目         | 路径                                            |
| ------------ | ----------------------------------------------- |
| 翻译站文档   | `./docs/docs/latest/`                           |
| 翻译站新闻页 | `./docs/news.md`                                |
| 翻译站图片   | `./docs/public/images/`                         |
| 源站文档     | `../pi-repo/packages/coding-agent/docs/`        |
| 源站图片     | `../pi-repo/packages/coding-agent/docs/images/` |

源站各包 CHANGELOG：

| 包           | 路径                                            |
| ------------ | ----------------------------------------------- |
| coding-agent | `../pi-repo/packages/coding-agent/CHANGELOG.md` |
| ai           | `../pi-repo/packages/ai/CHANGELOG.md`           |
| agent        | `../pi-repo/packages/agent/CHANGELOG.md`        |
| tui          | `../pi-repo/packages/tui/CHANGELOG.md`          |

---

## ⚠️ 执行约束

- 每个 `bash` / `ctx_execute` 调用是**独立 shell**，变量**不跨调用持久化**
- 本 Skill 所有 bash 脚本均设计为**单次调用完成**，禁止拆分为多次调用
- 标注"单次 bash 调用"的代码块必须**整块复制执行**，不得截取部分

---

## 前置 1：工作区检查（硬约束，不可跳过）

运行以下脚本检查两个仓库（**单次 bash 调用**）：

```bash
check_clean() {
  local name="$1" path="$2"
  local dirty=$(git -C "$path" status --porcelain 2>/dev/null)
  if [ -n "$dirty" ]; then
    echo "⚠️ $name 仓库脏（$path）："
    echo "$dirty" | sed 's/^/    /'
    return 1
  fi
  echo "✅ $name 干净"
  return 0
}

DIRTY=0
check_clean "翻译站" "." || DIRTY=1
check_clean "源站" "../pi-repo" || DIRTY=1
[ $DIRTY -eq 0 ] && echo "✅ 全部干净" || echo "❌ 有脏仓库，必须处理后才能继续"
```

**检测到脏仓库时**：停止，用 `ask_user_question` 工具**每个脏仓库独立询问**（不合并）：

```
ask_user_question(
  questions: [{
    question: "{翻译站/源站} 仓库有 N 个未提交修改，如何处理？",
    header: "脏仓库",
    options: [
      { label: "stash 暂存（推荐）", description: "git stash push -u -m \"sync: pre-sync\"，完成后 git stash pop 恢复" },
      { label: "放弃修改", description: "git reset --hard HEAD + git clean -fd，不可恢复" },
      { label: "退出", description: "停止 skill，由用户手动处理" }
    ]
  }]
)
```

**严禁**：❌ 默默 stash ❌ 默默 reset --hard ❌ 忽视脏状态继续执行

**选择"退出"** → 立即停止，不进入后续步骤。

**选择"stash"或"放弃"** → 执行命令后**重新运行检测脚本**，确认 ✅ 才继续。

---

## 前置 2：拉取源站最新代码

```bash
cd ../pi-repo
OLD_HEAD=$(git rev-parse HEAD)
git pull --rebase
NEW_HEAD=$(git rev-parse HEAD)

if [ "$OLD_HEAD" = "$NEW_HEAD" ]; then
  echo "ℹ️ 源站无新 commit（但可能仍有未同步版本，继续检查基线）"
else
  echo "✅ 拉取到 $(git rev-list --count ${OLD_HEAD}..${NEW_HEAD}) 个新 commit"
fi
```

**`git pull` 失败时**：先 `git stash`，然后重新 `git pull --rebase`。

---

## 步骤 0：统一探测（单次 bash 调用）

> ⚠️ **必须整块执行**。脚本内变量（LAST_TRANSLATED_VER、BASELINE_TS）仅在本次执行内有效。

```bash
set -e

# ── 0.1 提取翻译站最高已同步版本 ──
LAST_TRANSLATED_VER=$(grep -oE '^## v[0-9]+\.[0-9]+\.[0-9]+' ./docs/news.md 2>/dev/null \
  | head -1 | sed -E 's/^## v//' || true)

if [ -z "$LAST_TRANSLATED_VER" ]; then
  echo "⚠️ 首次同步：news.md 不存在或无版本条目"
  LAST_TRANSLATED_VER="0.0.0"
  FIRST_SYNC=1
else
  echo "✅ 翻译站已同步至: v${LAST_TRANSLATED_VER}"
  FIRST_SYNC=0
fi

# ── 0.2 反查源站基线时间戳 ──
cd ../pi-repo
CL="packages/coding-agent/CHANGELOG.md"

if [ "$FIRST_SYNC" = "1" ]; then
  BASELINE_TS=$(git log --format="%ct" --diff-filter=A -G "^## \[Unreleased\]" -- "$CL" 2>/dev/null | tail -1)
  echo "⚠️ 首次同步，基线 = [Unreleased] 首次出现 ts: $BASELINE_TS"
else
  BASELINE_TS=$(git log --format="%ct" -G "^## \[${LAST_TRANSLATED_VER}\]" -- "$CL" 2>/dev/null | tail -1)
  echo "✅ 基线 ts: $BASELINE_TS (v${LAST_TRANSLATED_VER} 首次加入 CHANGELOG 时刻)"
fi

if [ -z "$BASELINE_TS" ]; then
  echo "❌ 无法确定基线，请人工检查 news.md 版本号与源站 CHANGELOG 一致性"
  exit 1
fi

# ── 0.3 列出变更文件 ──
echo ""
echo "=== docs/ 变更 ==="
DOCS_DIFF=$(git log --since="@${BASELINE_TS}" --name-only --pretty=format: -- packages/coding-agent/docs/ \
  | grep -v "^$" | sort -u || true)
if [ -n "$DOCS_DIFF" ]; then
  DOCS_COUNT=$(printf '%s\n' "$DOCS_DIFF" | grep -c .)
else
  DOCS_COUNT=0
fi
[ -n "$DOCS_DIFF" ] && echo "$DOCS_DIFF" || echo "  (无)"

echo ""
echo "=== images/ 变更 ==="
IMAGE_DIFF=$(git log --since="@${BASELINE_TS}" --name-only --pretty=format: -- packages/coding-agent/docs/images/ \
  | grep -v "^$" | sort -u || true)
if [ -n "$IMAGE_DIFF" ]; then
  IMAGE_COUNT=$(printf '%s\n' "$IMAGE_DIFF" | grep -c .)
else
  IMAGE_COUNT=0
fi
[ -n "$IMAGE_DIFF" ] && echo "$IMAGE_DIFF" || echo "  (无)"

echo ""
echo "=== CHANGELOG 变更 ==="
CHANGELOG_DIFF=$(git log --since="@${BASELINE_TS}" --name-only --pretty=format: -- packages/*/CHANGELOG.md \
  | grep -v "^$" | sort -u || true)
[ -n "$CHANGELOG_DIFF" ] && echo "$CHANGELOG_DIFF" || echo "  (无)"

# ── 0.4 检测新版本（> LAST_TRANSLATED_VER 的已发布版本）──
echo ""
echo "=== 新版本检测（基线: v${LAST_TRANSLATED_VER}）==="
rm -f /tmp/sync_new_releases.txt
touch /tmp/sync_new_releases.txt
COMPARE_VER="$LAST_TRANSLATED_VER"

for pkg in coding-agent ai agent tui; do
  file="packages/$pkg/CHANGELOG.md"
  awk -v cmp="$COMPARE_VER" -v pkg="$pkg" '
    /^## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}/ {
      line = $0
      sub(/^## \[/, "", line)
      split(line, parts, "] - ")
      ver = parts[1]
      date = parts[2]
      split(ver, a, ".")
      split(cmp, b, ".")
      if (a[1]+0 > b[1]+0 ||
          (a[1] == b[1] && a[2]+0 > b[2]+0) ||
          (a[1] == b[1] && a[2] == b[2] && a[3]+0 > b[3]+0)) {
        printf "  %s: %s (%s)\n", pkg, ver, date
        printf "%s:%s:%s\n", pkg, ver, date >> "/tmp/sync_new_releases.txt"
      }
    }
  ' "$file" 2>/dev/null
done

NEW_VER_COUNT=$(wc -l < /tmp/sync_new_releases.txt | tr -d ' ')
echo ""
echo "新版本数: $NEW_VER_COUNT"
[ "$NEW_VER_COUNT" -gt 0 ] && cat /tmp/sync_new_releases.txt
rm -f /tmp/sync_new_releases.txt

# ── 0.5 汇总报告 ──
echo ""
echo "═══════════════════════════════════════"
echo "探测结果汇总"
echo "═══════════════════════════════════════"
echo "LAST_TRANSLATED_VER=$LAST_TRANSLATED_VER"
echo "BASELINE_TS=$BASELINE_TS"
echo "DOCS_CHANGES=$DOCS_COUNT"
echo "IMAGE_CHANGES=$IMAGE_COUNT"
echo "NEW_VERSIONS=$NEW_VER_COUNT"
echo "═══════════════════════════════════════"

# ── 0.6 零变更早退 ──
if [ "$NEW_VER_COUNT" -eq 0 ] && [ "$DOCS_COUNT" -eq 0 ] && [ "$IMAGE_COUNT" -eq 0 ]; then
  echo ""
  echo "✅ 零变更：源站已与翻译站同步，无需任何操作"
  echo "（自基线以来的 commit 均未影响 docs/、images/、新发布版本）"
  exit 0
fi
```

**零变更输出时** → 停止，告知用户同步已完成，**严禁**：❌ 强行走 A/B ❌ 空 commit ❌ 翻译源站不存在的内容

**有变更时** → 根据输出决定后续路径：

| 条件                   | 执行       |
| ---------------------- | ---------- |
| `NEW_VERSIONS > 0`     | 走 A 步骤  |
| `DOCS_CHANGES > 0`     | 走 B 步骤  |
| `IMAGE_CHANGES > 0`    | 走 B 步骤  |
| 以上均 0（不会到这里） | 零变更早退 |
| A + B 同时满足         | A → B 顺序 |

---

## A. 更新新闻页（当 `NEW_VERSIONS > 0` 时）

> ⚠️ **不要写入 `[Unreleased]` 条目**。news.md 只反映已发布版本。
>
> 判断标准：版本标题格式 `## [x.y.z] - YYYY-MM-DD`（含日期）= 已发布，写入。
> `## [Unreleased]` 或 `## [x.y.z]`（无日期）= 未发布，跳过。

### A.1 读取 CHANGELOG 内容

用 `read` 工具读取步骤 0 输出中有新版本的包的 CHANGELOG **前 60 行**（覆盖 `[Unreleased]` + 最近 2 个版本）。

### A.2 提取新版本条目

对步骤 0 报告的每个新版本，从对应 CHANGELOG 中提取 `## [x.y.z] - date` 下方、下一个 `## [` 之前的全部内容。

**忽略** `[Unreleased]` 段内容。

### A.3 翻译并写入 news.md

**插入位置**：在 `## v{LAST_TRANSLATED_VER}（...）` 之前插入新版本条目，保持版本号降序。

**如果 news.md 为空或不存在**，先写入：

```markdown
# 新闻

> Pi Coding Agent 及其子包的版本发布记录。
```

再插入版本条目。

**版本条目模板**（只为有实际内容的包生成 `<details>`，无变更的包不写）：

```markdown
## v{版本号}（{日期}）

<details>
<summary><strong>Pi Coding Agent</strong></summary>

新功能

- **{功能标题}** — {功能描述}。

修复

- {修复描述}（[#{issue号}](https://github.com/earendil-works/pi/issues/{issue号})）。

</details>

<details>
<summary><strong>Pi AI</strong></summary>

修复

- {修复描述}。

</details>
```

各包对应的 `<summary>` 标题：

| 包           | 显示名          |
| ------------ | --------------- |
| coding-agent | Pi Coding Agent |
| ai           | Pi AI           |
| agent        | Pi Agent        |
| tui          | Pi TUI          |

**分类标题翻译对照表：**

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

| 源站链接                                              | 翻译站链接                                                   | 备注                |
| ----------------------------------------------------- | ------------------------------------------------------------ | ------------------- |
| `usage.md` / `extensions.md`                          | `/docs/latest/usage` / `/docs/latest/extensions`             | 站内同级文件        |
| `extensions.md#overlay-options`                       | `/docs/latest/extensions#overlay-options`                    | ⚠️ **锚点必须保留** |
| `themes.md#dark-theme` / `tui.md#overlay-focus`       | `/docs/latest/themes#dark-theme` / `/docs/latest/tui#...`    | 同上                |
| `../README.md`                                        | `https://github.com/earendil-works/pi/blob/main/README.md`   | 改为 GitHub URL     |
| `docs/foo.md`                                         | `https://github.com/earendil-works/pi/blob/main/docs/foo.md` | `docs/` 前缀改 URL  |
| `https://github.com/earendil-works/pi/issues/1234`    | 原样保留                                                     | Issue 链接          |
| `https://github.com/earendil-works/pi-mono/pull/1234` | 原样保留                                                     | ⚠️ 保留 `pi-mono`   |

**最容易出错的 3 个点：**

1. 带锚点的相对链接 → **文件名 + 锚点都要保留**（最常见的丢失）
2. 旧仓库 `pi-mono` 链接 → 保留 `pi-mono`，不要改成 `pi`
3. `../README.md` → 必须是 GitHub URL，不能变成 `/docs/latest/README`

---

## B. 翻译同步与审核（当 `DOCS_CHANGES > 0` 或 `IMAGE_CHANGES > 0` 时）

### B.1 文件清单对比（单次 bash 调用）

```bash
echo "=== 源站文档 ==="
ls -1 ../pi-repo/packages/coding-agent/docs/*.md | xargs -I{} basename {} | sort

echo ""
echo "=== 翻译站文档 ==="
ls -1 ./docs/docs/latest/*.md ./docs/docs/latest/*.mdx 2>/dev/null \
  | xargs -I{} basename {} | sort
```

找出：

- 源站有但翻译站缺失的文件（需新建翻译）
- 翻译站有但源站缺失的文件（可能是自定义内容，保留）
- 文件名格式差异（`.md` vs `.mdx`）

### B.2 聚焦变更文件对比

**只对步骤 0 报告的 `DOCS_DIFF` 文件做内容比对**，不做全量审计。

对每个变更文件：

1. 用 `read` 工具同时读取源站和翻译站对应文件
2. 逐段对比：标题层级、列表项完整性、代码示例一致性、表格完整性
3. 同步源站新增/修改的内容到翻译站

**图片同步**（当 `IMAGE_CHANGES > 0`）：

```bash
cp ../pi-repo/packages/coding-agent/docs/images/* ./docs/public/images/
```

### B.3 翻译质量检查

对新建或修改的翻译内容，检查：

**术语一致性：**

| 英文       | 中文                             |
| ---------- | -------------------------------- |
| extension  | 扩展                             |
| skill      | Skill（保持英文，首字母大写）    |
| provider   | Provider（保持英文）             |
| prompt     | Prompt（保持英文）               |
| thinking   | thinking（保持英文小写）         |
| token      | Token（首字母大写）              |
| steering   | steering（保持英文小写）         |
| follow-up  | follow-up（保持英文）            |
| compaction | 压缩                             |
| session    | 会话                             |
| keybinding | 快捷键                           |
| theme      | 主题                             |
| tool call  | tool call（保持英文）或 工具调用 |
| command    | 命令                             |

**代码/示例保护（以下内容不得翻译）：**

- 代码块内文本、命令行示例、文件路径
- 环境变量名、JSON 键名、TypeScript 类型定义
- 终端输出

**翻译质量常见问题：**

- 「的、地、得」使用不当
- 长定语不切分（结构套叠）
- 被动语态直译（应转主动）
- 英文句式直译（如 "This means..." → 不应直接译为 "这意味着..."）

**链接验证：**

- 站内链接用 `/docs/latest/xxx` 格式
- GitHub issue/PR 链接原样保留
- 图片路径有效

---

## 构建验证

```bash
pnpm run build
```

确认无死链接错误、构建产物正常。

---

## 提交并推送

```bash
git add -A
git commit -m "sync: 同步源站文档更新"
git push
```

commit message 应反映具体变更，例如：`sync: 同步 v0.79.3 发布记录` 或 `sync: 同步 usage.md 更新`。

---

## 工作流快捷键

| 目标       | 执行路径                                               |
| ---------- | ------------------------------------------------------ |
| 只更新新闻 | 工作区检查 → 拉取 → 探测 → A → 构建验证 → 提交推送     |
| 只审核翻译 | 工作区检查 → 拉取 → 探测 → B → 构建验证 → 提交推送     |
| 全部同步   | 工作区检查 → 拉取 → 探测 → A → B → 构建验证 → 提交推送 |

> **工作区检查不可跳过**：任一仓库脏，必须先处理（stash / 放弃 / 退出），否则不继续。
