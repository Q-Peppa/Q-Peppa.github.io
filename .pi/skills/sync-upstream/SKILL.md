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

### ❌ 禁用 `grep`

pi 的 bash 工具会**间歇性**把 `grep` 路由到 ripgrep（rg），导致输出带文件名前缀（`file:match` 格式），即使是 `command grep`、绝对路径 `/usr/bin/grep`、或加 `-h` 都无法规避——这是 wrapper 层的拦截，不是二进制问题。

**所有文件内容匹配 / 过滤 / 计数必须用 `sed`、`awk`、`git` 自带能力，不得出现 `grep` 命令。** 常见替换：

| 用途           | ❌ 禁用            | ✅ 替代                               |
| -------------- | ------------------ | ------------------------------------- |
| 提取匹配行     | `grep -oE 'pat' f` | `sed -nE 's/.*pat.*/\1/p' f`          |
| 过滤空行       | `grep -v '^$'`     | `awk 'NF'`                            |
| 计数非空行     | `grep -c .`        | `awk 'NF' \| wc -l`                   |
| 过滤含模式的行 | `grep -v 'pat'`    | `awk '!/pat/'`                        |
| 列文件名       | `ls *.md \| grep`  | `ls` + `awk`/`sed`，或 `git ls-files` |

### 状态文件

上次同步的源站 HEAD SHA 存于 `./.pi/sync-state`（翻译站仓库内，提交进 git，团队共享基线）。首次同步时该文件不存在，需手动初始化（见「前置 0」）。每次成功同步后，脚本会用当前 HEAD SHA 覆盖该文件。

---

## 前置 0：状态文件初始化（仅首次同步）

检查 `./.pi/sync-state` 是否存在：

```bash
if [ -f ./.pi/sync-state ] && [ -s ./.pi/sync-state ]; then
  LAST_SYNC_SHA=$(cat ./.pi/sync-state | tr -d '[:space:]')
  echo "✅ 状态文件存在，上次同步基线 SHA: ${LAST_SYNC_SHA}"
else
  echo "❌ 状态文件 ./.pi/sync-state 不存在或为空（首次同步）"
  echo ""
  echo "请手动初始化："
  echo "  1. 确定翻译站当前已同步到的源站 commit（参考 news.md 最高版本对应的源站 commit）"
  echo "  2. 写入该 commit 的完整 SHA："
  echo "     echo '<完整40位SHA>' > ./.pi/sync-state"
  echo "  3. git add .pi/sync-state && git commit -m 'chore: 初始化 sync-upstream 状态文件'"
  echo "  4. 重新运行本 skill"
  exit 1
fi

# 校验 SHA 在源站存在且不是当前 HEAD（避免无效基线）
cd ../pi-repo
if ! git cat-file -e "${LAST_SYNC_SHA}^{commit}" 2>/dev/null; then
  echo "❌ 状态文件中的 SHA 在源站不存在: ${LAST_SYNC_SHA}"
  echo "   请检查 ./.pi/sync-state 内容，修正后重试"
  exit 1
fi
CURRENT_HEAD=$(git rev-parse HEAD)
if [ "$LAST_SYNC_SHA" = "$CURRENT_HEAD" ]; then
  echo "ℹ️ 基线 SHA == 当前 HEAD，自上次同步无新 commit"
fi
echo "基线 SHA 已校验：${LAST_SYNC_SHA}"
```

**状态文件不存在时** → 停止，按提示手动初始化，**严禁**：❌ 默默用某个 SHA 填充 ❌ 回退到时间戳方案。

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

**rebase 冲突时**（`git stash` 解决的是"未提交修改"，解决不了分叉冲突）：`git rebase --abort` 回到拉取前状态，**停止 skill**，告知用户源站存在 rebase 冲突需人工处理，**严禁** ❌ 强行 `git rebase --skip` ❌ 手动改源站文件强行解决。

---

## 步骤 0：统一探测（单次 bash 调用）

> ⚠️ **必须整块执行**。锚点用 commit SHA（来自 `./.pi/sync-state`），不用版本号反查时间戳。
> 变更清单来自 `git diff` 树差异，不依赖 commit message。
> 全程禁用 `grep`，用 `sed`/`awk`/`git` 自带能力。

```bash
set -e

# ── 0.1 读取基线 SHA（前置 0 已校验存在性，这里读值）──
LAST_SYNC_SHA=$(cat ./.pi/sync-state | tr -d '[:space:]')
echo "✅ 基线 SHA: ${LAST_SYNC_SHA}"

# 记录翻译站根路径，供后续在源站目录内回写翻译站文件
TRANSLATION_ROOT=$(pwd)

cd ../pi-repo
CURRENT_HEAD=$(git rev-parse HEAD)
echo "✅ 当前 HEAD: ${CURRENT_HEAD}"

if [ "$LAST_SYNC_SHA" = "$CURRENT_HEAD" ]; then
  echo ""
  echo "✅ 零变更：源站 HEAD 未推进（基线 == HEAD），无需任何操作"
  exit 0
fi

# ── 0.2 列出变更文件（git diff 树差异，不读 message）──
# --name-only 输出变更文件路径；awk NF 过滤空行（禁用 grep）
DOCS_DIFF=$(git diff --name-only "${LAST_SYNC_SHA}".."${CURRENT_HEAD}" -- packages/coding-agent/docs/ | awk 'NF' | sort -u || true)
IMAGE_DIFF=$(git diff --name-only "${LAST_SYNC_SHA}".."${CURRENT_HEAD}" -- packages/coding-agent/docs/images/ | awk 'NF' | sort -u || true)
CHANGELOG_DIFF=$(git diff --name-only "${LAST_SYNC_SHA}".."${CURRENT_HEAD}" -- packages/coding-agent/CHANGELOG.md packages/ai/CHANGELOG.md packages/agent/CHANGELOG.md packages/tui/CHANGELOG.md | awk 'NF' | sort -u || true)

# docs/ 下的 .md/.mdx 变更（排除 images/ 子目录，已在 IMAGE_DIFF 单独处理）
DOCS_MD_DIFF=$(printf '%s\n' "$DOCS_DIFF" | awk 'NF && /\.(md|mdx)$/ {print}' || true)
DOCS_COUNT=$(printf '%s\n' "$DOCS_MD_DIFF" | awk 'NF' | wc -l | tr -d ' ')
IMAGE_COUNT=$(printf '%s\n' "$IMAGE_DIFF" | awk 'NF' | wc -l | tr -d ' ')

# ── 0.3 打印变更清单 ──
echo ""
echo "=== docs/ 文档变更 ==="
[ -n "$DOCS_MD_DIFF" ] && echo "$DOCS_MD_DIFF" || echo "  (无)"

echo ""
echo "=== images/ 图片变更 ==="
[ -n "$IMAGE_DIFF" ] && echo "$IMAGE_DIFF" || echo "  (无)"

echo ""
echo "=== CHANGELOG 变更 ==="
[ -n "$CHANGELOG_DIFF" ] && echo "$CHANGELOG_DIFF" || echo "  (无)"

# ── 0.4 检测新发布版本（解析 CHANGELOG 增量 diff，而非扫全文件比版本号）──
# 思路：新版本号一定是「新增的 ## [x.y.z] - date 行」，在 diff 里是绿色 + 开头。
# 只看 CHANGELOG 有变更的包，提取 diff 中新增的版本标题行。
echo ""
echo "=== 新版本检测 ==="
NEW_VERSIONS=""

for pkg in coding-agent ai agent tui; do
  file="packages/$pkg/CHANGELOG.md"
  # 该包 CHANGELOG 是否在变更清单内
  if printf '%s\n' "$CHANGELOG_DIFF" | awk -v f="$file" '$0==f{found=1} END{exit !found}'; then
    # 提取增量 diff 中新增的「## [x.y.z] - YYYY-MM-DD」行（diff 的 + 行）
    # 跳过 [Unreleased]（无日期）和无日期的版本标题
    new_releases=$(git diff "${LAST_SYNC_SHA}".."${CURRENT_HEAD}" -- "$file" \
      | awk '
        /^\+## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}/ {
          line = $0
          sub(/^\+## \[/, "", line)
          split(line, parts, "] - ")
          ver = parts[1]
          date = parts[2]
          printf "  %s: %s (%s)\n", pkg, ver, date
        }
      ' pkg="$pkg" || true)
    if [ -n "$new_releases" ]; then
      NEW_VERSIONS="${NEW_VERSIONS}${new_releases}\n"
      echo "$new_releases"
    fi
  fi
done

# 计数新版本数
if [ -n "$NEW_VERSIONS" ]; then
  NEW_VER_COUNT=$(printf '%b' "$NEW_VERSIONS" | awk 'NF' | wc -l | tr -d ' ')
else
  NEW_VER_COUNT=0
fi
echo ""
echo "新版本数: $NEW_VER_COUNT"

# ── 0.5 汇总报告 ──
echo ""
echo "═══════════════════════════════════════"
echo "探测结果汇总"
echo "═══════════════════════════════════════"
echo "LAST_SYNC_SHA=$LAST_SYNC_SHA"
echo "CURRENT_HEAD=$CURRENT_HEAD"
echo "DOCS_CHANGES=$DOCS_COUNT"
echo "IMAGE_CHANGES=$IMAGE_COUNT"
echo "NEW_VERSIONS=$NEW_VER_COUNT"
echo "═══════════════════════════════════════"

# ── 0.6 零变更早退 ──
if [ "$NEW_VER_COUNT" -eq 0 ] && [ "$DOCS_COUNT" -eq 0 ] && [ "$IMAGE_COUNT" -eq 0 ]; then
  echo ""
  echo "✅ 零变更：源站自基线以来的 commit 均未影响 docs/、images/、未发布新版本"
  echo "（可能只有代码改动或 [Unreleased] 段更新，无需同步）"
  echo "⚠️ 注意：未更新状态文件，基线保持 $LAST_SYNC_SHA"
  echo "   如确认无需同步内容，可手动执行："
  echo "   echo '${CURRENT_HEAD}' > ./.pi/sync-state"
  echo "   git add .pi/sync-state && git commit -m 'chore: 推进 sync 基线（无内容变更）'"
  exit 0
fi

# 输出 CURRENT_HEAD 供后续步骤使用（提交时更新状态文件）
# 落盘到 ./.pi/sync-head（临时文件，已加入 .gitignore，不入库），避免提交步骤靠人工回填 40 位 SHA
echo "$CURRENT_HEAD" > "$TRANSLATION_ROOT/.pi/sync-head"
echo ""
echo ">>> 探测完成，CURRENT_HEAD 已写入 ./.pi/sync-head（临时文件，不入库）"
echo ">>> 「提交并推送」步骤会读取该文件更新 ./.pi/sync-state，并在提交后清理它"
```

**零变更输出时** → 停止，告知用户同步已完成，**严禁**：❌ 强行走 A/B ❌ 空 commit ❌ 翻译源站不存在的内容。
零变更时是否推进基线由用户决定（脚本会提示手动命令），skill 不自动提交。

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

取翻译站当前最高版本号（确定插入锚点，避免人眼比对）：

```bash
sed -nE 's/^## v([0-9]+\.[0-9]+\.[0-9]+).*/\1/p' ./docs/news.md | head -1
```

若该命令输出为空（news.md 无任何已发布版本条目），按下面「news.md 为空」分支处理。

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
ls -1 ../pi-repo/packages/coding-agent/docs/*.md ../pi-repo/packages/coding-agent/docs/*.mdx 2>/dev/null \
  | xargs -I{} basename {} | sort

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

**图片同步**（当 `IMAGE_CHANGES > 0`）：只同步步骤 0 报告的 `IMAGE_DIFF` 文件，不做全量覆盖（避免源站已删除的图在翻译站残留）。先在源站目录内取变更清单，再逐个 cp：

```bash
# 在源站目录内执行：列出基线→HEAD 间变更的图片路径（相对源站根）
cd ../pi-repo
LAST_SYNC_SHA=$(cat "${OLDPWD}/.pi/sync-state" | tr -d '[:space:]')
CURRENT_HEAD=$(git rev-parse HEAD)
git diff --name-only "${LAST_SYNC_SHA}".."${CURRENT_HEAD}" -- packages/coding-agent/docs/images/ \
  | awk 'NF' > /tmp/sync-image-diff
# 回翻译站，逐个同步（含删除：源站删了的图，翻译站也删）
cd - >/dev/null
while IFS= read -r f; do
  [ -z "$f" ] && continue
  rel="${f#packages/coding-agent/docs/}"   # images/xxx.png
  src="../pi-repo/packages/coding-agent/docs/$rel"
  dst="./docs/public/$rel"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst" && echo "✅ 同步图片: $rel"
  else
    [ -f "$dst" ] && rm -f "$dst" && echo "🗑️ 删除已移除图片: $rel"
  fi
done < /tmp/sync-image-diff
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

> ⚠️ **必须更新状态文件**：用步骤 0 探测出的 `CURRENT_HEAD` 覆盖 `./.pi/sync-state`，
> 否则下次同步会重复处理本次已同步的变更。`CURRENT_HEAD` 已由步骤 0 落盘到
> `./.pi/sync-head`（临时文件，已加入 `.gitignore`），本步骤读取它，无需人工回填。

```bash
# 步骤 0 已将 CURRENT_HEAD 写入 ./.pi/sync-head；缺失时回退到源站 HEAD
if [ -s ./.pi/sync-head ]; then
  CURRENT_HEAD=$(cat ./.pi/sync-head | tr -d '[:space:]')
else
  echo "⚠️ ./.pi/sync-head 缺失，回退到源站当前 HEAD"
  CURRENT_HEAD=$(git -C ../pi-repo rev-parse HEAD)
fi
echo "将推进基线至: ${CURRENT_HEAD}"

echo "$CURRENT_HEAD" > ./.pi/sync-state
# sync-head 是临时文件（已 gitignore），不入库，提交前清理
rm -f ./.pi/sync-head
git add -A
git commit -m "sync: 同步源站文档更新"
git push
```

commit message 应反映具体变更，例如：`sync: 同步 v0.79.3 发布记录` 或 `sync: 同步 usage.md 更新`。

**状态文件未更新是严重错误**：会导致下次同步基线滞后，重复处理同一批变更，
可能造成 news.md 版本条目重复、翻译内容重复同步。提交前务必确认
`./.pi/sync-state` 内容已更新为当前源站 HEAD。

---

## 工作流快捷键

| 目标       | 执行路径                                                        |
| ---------- | --------------------------------------------------------------- |
| 只更新新闻 | 前置 0 → 前置 1 → 前置 2 → 步骤 0 → A → 构建验证 → 提交推送     |
| 只审核翻译 | 前置 0 → 前置 1 → 前置 2 → 步骤 0 → B → 构建验证 → 提交推送     |
| 全部同步   | 前置 0 → 前置 1 → 前置 2 → 步骤 0 → A → B → 构建验证 → 提交推送 |

> **前置 0（状态文件）和前置 1（工作区检查）均不可跳过**：
>
> - 状态文件不存在 → 手动初始化后才能继续
> - 任一仓库脏 → 必须先处理（stash / 放弃 / 退出），否则不继续
