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

> ⚠️ **为什么不用 `sync:` commit 的 hash 作为基线？**
> 翻译站和源站是**两个独立的 git 仓库**，翻译站 commit `14eaa6f` 在源站根本不存在，`git diff 14eaa6f..HEAD` 会直接 `fatal: bad revision`。
> 正确做法：用**翻译站 `news.md` 顶部最后一条版本号**（= 翻译站实际已同步到的最高版本）反查**源站**该版本对应的 commit committer time，作为 BASELINE_TS。
> 后续所有"自基线以来"的查询都用 `--since="@${BASELINE_TS}"`，跨仓库对齐。

#### 步骤 1：提取翻译站最高已同步版本

```bash
cd .

# 从 news.md 顶部找最后一条 `## v{x.y.z}（{date}）`
# 用 head -20 避免长文件全读
LAST_TRANSLATED_VER=$(head -20 docs/news.md 2>/dev/null \
  | grep -oE "^## v[0-9]+\.[0-9]+\.[0-9]+" \
  | head -1 \
  | sed -E 's/^## v//')

if [ -z "$LAST_TRANSLATED_VER" ]; then
  echo "⚠️ 翻译站 news.md 不存在或无版本条目，首次同步"
  FIRST_SYNC=1
else
  echo "✅ 翻译站已同步到的最高版本: v${LAST_TRANSLATED_VER}"
  FIRST_SYNC=0
fi
```

#### 步骤 2：反查源站该版本对应 commit 的 committer time

```bash
cd ../pi-repo
CHANGELOG="packages/coding-agent/CHANGELOG.md"

if [ "$FIRST_SYNC" = "1" ]; then
  # 首次同步：取源站最新 [Unreleased] 段首次出现的 commit
  # 这样"自基线以来"包括 [Unreleased] 中所有变更
  BASELINE_TS=$(git log --format="%ct" --diff-filter=A -G "^## \[Unreleased\]" -- "$CHANGELOG" 2>/dev/null | tail -1)
  echo "⚠️ 首次同步，基线 = [Unreleased] 段首次出现 commit ts: $BASELINE_TS"
else
  # 找 `## [x.y.z] - date` 段首次被加入 CHANGELOG 的 commit ts
  # -G 用正则匹配该版本段标题
  # 取最早一次（tail -1，因为 git log 默认倒序）
  BASELINE_TS=$(git log --format="%ct" -G "^## \[${LAST_TRANSLATED_VER}\]" -- "$CHANGELOG" 2>/dev/null | tail -1)
  echo "✅ 基线 ts: $BASELINE_TS (源站 v${LAST_TRANSLATED_VER} 段首次加入 CHANGELOG 的 commit 时刻)"
fi
```

#### 步骤 3：保留 BASELINE_TS 供后续步骤使用

后续 `git log` / `git diff` 都用 `--since="@${BASELINE_TS}"` 代替 `SINCE..HEAD`：

```bash
# 正确（跨仓库安全）：
git log --since="@${BASELINE_TS}" --oneline
git diff $(git log --since="@${BASELINE_TS}" --format="%H" | tail -1)^ HEAD

# 错误（commit hash 跨仓库不存在）：
git diff ${LAST_SYNC}..HEAD   # ← 会 fatal
```

#### 边界情况处理

| 场景                                                           | 行为                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| 翻译站 news.md 不存在                                          | 标记 `FIRST_SYNC=1`，基线取源站 `[Unreleased]` 首次出现 ts |
| 翻译站 news.md 头部有 `# 新闻` 但无版本                        | 同上                                                       |
| 翻译站 news.md 顶部版本在源站 CHANGELOG 找不到                 | 报错，提示人工检查版本号一致性                             |
| 翻译站 news.md 顶部版本在源站 CHANGELOG 被 amend 过            | `-G` 仍能匹配到 commit，取最早 ts（可能略早于实际发布日）  |
| 翻译站 sync: commit 比 news.md 更新（commit 后未更新 news.md） | 优先用 news.md，因为 news.md 反映"翻译站实际已同步的内容"  |

### 0.2 列出本次同步的源站变更

> 用 0.1 步拿到的 `BASELINE_TS` 作为基线，**不要**用 `git diff SINCE..HEAD`（跨仓库会 fatal）。

```bash
cd ../pi-repo

echo ""
echo "=== 自基线 (${BASELINE_TS}) 以来的源站 commit ==="
git log --since="@${BASELINE_TS}" --oneline

echo ""
echo "=== docs/ 变更文件（影响 B 翻译同步） ==="
DOCS_DIFF=$(git log --since="@${BASELINE_TS}" --name-only --pretty=format: -- packages/coding-agent/docs/ | grep -v "^$" | sort -u)
if [ -z "$DOCS_DIFF" ]; then
  echo "  (无变更)"
else
  echo "$DOCS_DIFF"
fi

echo ""
echo "=== CHANGELOG 变更文件（影响 A 新闻同步） ==="
CHANGELOG_DIFF=$(git log --since="@${BASELINE_TS}" --name-only --pretty=format: -- packages/*/CHANGELOG.md | grep -v "^$" | sort -u)
if [ -z "$CHANGELOG_DIFF" ]; then
  echo "  (无变更)"
else
  echo "$CHANGELOG_DIFF"
fi

echo ""
echo "=== 图片资产变更 ==="
IMAGE_DIFF=$(git log --since="@${BASELINE_TS}" --name-only --pretty=format: -- packages/coding-agent/docs/images/ | grep -v "^$" | sort -u)
if [ -z "$IMAGE_DIFF" ]; then
  echo "  (无变更)"
else
  echo "$IMAGE_DIFF"
fi
```

**判定标准：**

- `docs/` 有变更 → 走 B 步骤，重点对比变更文件
- `CHANGELOG.md` 有变更且**含已发布版本** → 走 A 步骤，提取新版本写入 news.md
- `images/` 有变更 → 复制到翻译站 `./docs/public/images/`
- 全部为空 → ⏭️ **走零变更早退分支**（见下）

#### ⏭️ 零变更早退分支

> **为什么需要这个分支？** skill 之前默认"每次同步一定有内容可改"，但实际可能：
>
> - 源站有 commit 但全是非 docs/ 改动（CHANGELOG、源码、tests、CI）
> - CHANGELOG 改动都在 `[Unreleased]` 段，无新发布版本
> - 翻译站已经领先于源站
>
> 这种情况下，**强行进入 A/B 步骤会导致 LLM 找事做**（乱改文件、空 commit、误译），必须早退。

```bash
# 统计各项是否有变更
DOCS_HAS_CHANGE=$([ -n "$DOCS_DIFF" ] && echo 1 || echo 0)
IMAGES_HAS_CHANGE=$([ -n "$IMAGE_DIFF" ] && echo 1 || echo 0)
# CHANGELOG 是否含"已发布新版本"由 0.3 步判断，这里先假定 0
CHANGELOG_HAS_NEW_RELEASE=0  # 0.3 步会更新

# === 零变更判定 ===
if [ "$DOCS_HAS_CHANGE" = "0" ] && [ "$IMAGES_HAS_CHANGE" = "0" ] && [ "$CHANGELOG_HAS_NEW_RELEASE" = "0" ]; then
  echo ""
  echo "═══════════════════════════════════════════════"
  echo "✅ 零变更：源站已与翻译站同步，无需任何操作"
  echo "═══════════════════════════════════════════════"
  echo "翻译站最高已同步版本: v${LAST_TRANSLATED_VER}"
  echo "基线 ts: ${BASELINE_TS}"
  echo ""
  echo "自基线以来的源站 commit:"
  git -C ../pi-repo log --since="@${BASELINE_TS}" --oneline
  echo ""
  echo "(以上 commit 均未影响 docs/ 用户文档、images/ 资产、新发布版本)"
  echo "(如有特殊需求：source 代码已就位但 docs/ 未补全，请人工处理)"
  echo ""
  # 显式退出 skill
  exit 0
fi

# 不为零变更，继续走 0.3
```

**对 AI 的硬约束**：当早退分支触发时，**严禁**以下行为：

1. ❌ 强行走 A/B 步骤（"既然来了就做点什么"）
2. ❌ 翻译一份源站没有的中文文档（如 trust 功能）
3. ❌ 提交一个无内容的 `sync: no-op` commit
4. ❌ 重新构建或重新推送

**只输出"零变更"报告**给用户，等下次源站有实际变更再处理。

### 0.3 提取 CHANGELOG 中"自基线以来"的新增已发布版本

> 之前用 awk 一把梭会输出所有历史版本（本次实际跑出 100+ 行），因为它只跳过 `[Unreleased]`，没有按基线过滤。
> 新版用 **版本号字典序比较 + date 字段辅助** 双过滤，**只输出基线之后**发布的新版本。

#### 算法

1. 从 `docs/news.md` 顶部拿到 `LAST_TRANSLATED_VER`（翻译站已同步的最高版本，如 `0.78.1`）
2. 对每个包的 CHANGELOG，提取**所有** `## [x.y.z] - YYYY-MM-DD` 段
3. 对每个版本号，用 `sort -V` 字典序比较，**只保留 > `LAST_TRANSLATED_VER`** 的版本
4. 辅助检查：date 字段应 >= `BASELINE_TS` 对应日期（防止版本号乱序或翻译站漏更新）

```bash
cd ../pi-repo

# 如果是首次同步，LAST_TRANSLATED_VER 为空，用 "0.0.0" 兜底
# 这样会输出所有已发布版本（首次同步需要全部提取）
COMPARE_VER="${LAST_TRANSLATED_VER:-0.0.0}"

NEW_RELEASES=""  # 收集所有新版本，格式 "pkg:ver:date"

for pkg in coding-agent ai agent tui; do
  file="packages/$pkg/CHANGELOG.md"
  echo ""
  echo "=== $pkg (新于 v${COMPARE_VER} 的已发布版本) ==="

  # 提取所有 `## [x.y.z] - YYYY-MM-DD` 行 → 输出 "x.y.z YYYY-MM-DD"
  grep -E "^## \[[0-9]+\.[0-9]+\.[0-9]+\] - [0-9]{4}-[0-9]{2}-[0-9]{2}" "$file" \
    | sed -E 's/^## \[([0-9.]+)\] - ([0-9-]+).*$/\1 \2/' \
    | while read ver date; do
        # 用 sort -V 比较：若 ver > COMPARE_VER，则输出
        # sort -V 会按字典序+数字序排序，"0.78.1" > "0.78.0" > "0.10.0"
        higher=$(printf '%s\n%s\n' "$COMPARE_VER" "$ver" | sort -V | tail -1)
        if [ "$higher" = "$ver" ] && [ "$ver" != "$COMPARE_VER" ]; then
          echo "  $ver  ($date)"
          # 同时累加到 NEW_RELEASES 全局变量
          echo "${pkg}:${ver}:${date}" >> /tmp/sync_new_releases.txt
        fi
      done
done

# 汇总
echo ""
echo "═══════════════════════════════════════════════"
echo "新发布版本汇总 (共 $(wc -l < /tmp/sync_new_releases.txt 2>/dev/null || echo 0) 条):"
cat /tmp/sync_new_releases.txt 2>/dev/null
echo "═══════════════════════════════════════════════"
rm -f /tmp/sync_new_releases.txt

# 回写 0.2 步的 CHANGELOG_HAS_NEW_RELEASE 标志
CHANGELOG_HAS_NEW_RELEASE=$([ -s /tmp/sync_new_releases.txt ] && echo 1 || echo 0)
```

**关键设计点**：

| 设计                                                    | 为什么                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| 主过滤用 `sort -V` 比较版本号                           | 字典序+数字序正确处理 `0.10.0 > 0.9.0`，不依赖时区或 commit time        |
| 兜底 `COMPARE_VER=0.0.0`                                | 首次同步时 `LAST_TRANSLATED_VER` 为空，会输出所有版本（首次需要全量）   |
| 输出格式 `pkg:ver:date`                                 | 供 A 步骤直接 awk/sed 处理，避免重复提取                                |
| 用临时文件 `/tmp/sync_new_releases.txt` 跨 for 循环传递 | shell 变量在管道 `while read` 中是子 shell，主 shell 看不到，必须用文件 |
| `echo "0"`/`echo "1"` 写入                              | 0.2 步的零变更判定需要这个标志                                          |

**双保险**（可选）：如果担心 `sort -V` 误判，可在每个版本后再加 date 检查：

```bash
# date 转 unix ts，跟 BASELINE_TS 对比
ver_ts=$(date -d "$date" +%s 2>/dev/null)
# 留 24h buffer：发布日期可能在基线 ts 之前的 24 小时内（罕见但可能）
if [ "$ver_ts" -ge $((BASELINE_TS - 86400)) ]; then
  # 二次确认（用 git log -G 找该版本 commit ts）
  commit_ts=$(git log -G "^## \\[$ver\\]" --format="%ct" -- "$file" 2>/dev/null | tail -1)
  if [ -n "$commit_ts" ] && [ "$commit_ts" -gt "$BASELINE_TS" ]; then
    echo "  $ver  ($date)  [commit ts=$commit_ts]"
  fi
fi
```

但一般不需要这层——`sort -V` 已经能正确处理绝大多数情况。

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
