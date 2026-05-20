---
name: translation-review
description: >-
  对比翻译文档与源站英文文档，检查文件完整性、内容落后、机器翻译痕迹和不符合中文习惯的表述。
  适用于本 Pi 中文文档站点的翻译质量审核。
---

# 翻译审核（Translation Review）

对 `/home/demo/projects/Q-Peppa.github.io`（中文翻译站）与 `/home/demo/pi-repo`（源站英文文档）进行全面对比审核。

---

## 前置：拉取源站最新代码

> 源站 `/home/demo/pi-repo` 是浅克隆（`--depth 1`），每次审核前先拉取最新内容。

### 普通更新（保持浅克隆）

```bash
cd /home/demo/pi-repo
git pull --depth 1
```

### 如果首次深度拉取或遇到冲突

推荐转为完整克隆（只做一次）：

```bash
cd /home/demo/pi-repo
git fetch --unshallow
git pull
```

之后每次只需 `git pull` 即可。

### 如果 `git pull` 报错

可能是本地做了修改导致冲突，先重置再拉：

```bash
cd /home/demo/pi-repo
git stash
git pull --depth 1
```

---

## 工作流程

按以下顺序逐步执行：

### 第 1 步：列出文件清单

列出源站和翻译站的文档文件，确认覆盖情况。

```bash
# 源站文档列表
ls -1 /home/demo/pi-repo/packages/coding-agent/docs/*.md | xargs -I{} basename {} | sort

# 翻译站文档列表
ls -1 /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.md \
  /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.mdx 2>/dev/null \
  | xargs -I{} basename {} | sort
```

**检查要点：**
- 源站有的文件，翻译站是否有对应的翻译
- 翻译站是否有额外的文件（如 `cdn-setup.md`）
- 文件名差异（`.md` vs `.mdx`）
- 图片文件是否已同步

### 第 2 步：行数对比

快速判断是否有内容明显差异。

```bash
# 源站行数
echo "=== 源站 ==="
wc -l /home/demo/pi-repo/packages/coding-agent/docs/*.md | sort -n

echo ""
echo "=== 翻译站 ==="
wc -l /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.md \
  /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.mdx 2>/dev/null | sort -n
```

**检查要点：**
- 行数相差很大的文件（>20 行差异），标记为需要深入对比
- 翻译站明显行数更多的——可能是增加了增强内容（表格、说明）——需确认是否有用
- 翻译站明显行数更少的——可能是内容缺失或翻译省略——需仔细排查

### 第 3 步：逐文件内容比对

对第 2 步中标记的文件，以及以下关键文件进行内容比对：

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

逐文件检查以下质量维度：

#### 4.1 术语一致性

检查关键术语的翻译是否全站统一：

| 英文 | 期望的中文 |
|------|-----------|
| extension | 扩展 |
| skill | Skill（保持英文，首字母大写）或 技能 |
| provider | Provider（保持英文） |
| prompt | Prompt（保持英文） |
| thinking | thinking（保持英文小写） |
| token | Token（首字母大写） |
| steering | steering（保持英文小写） |
| follow-up | follow-up（保持英文） |
| compaction | 压缩 |
| session | 会话 |
| keybinding | 快捷键 |
| theme | 主题 |
| tool call | tool call（保持英文）或 工具调用 |
| command | 命令 |

**检查方法：**
```bash
# 在翻译站中搜索术语的使用情况
grep -n 'extension\|skill\|provider\|prompt\|thinking\|token\|steering\|follow-up' \
  /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.md \
  /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.mdx 2>/dev/null \
  | grep -v '法律声明' | head -40
```

#### 4.2 机器翻译痕迹

检查以下机器翻译常见问题：
- 「的、地、得」使用不当
- 长定语不切分（如「通过……的……」结构套叠）
- 被动语态直译（应转为主动语态）
- 英文句式直译（如 "This means..." → 不应直接为 "这意味着..."，可根据上下文灵活翻译）
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

```bash
# 查找所有链接
grep -n '\[.*\](.*)' \
  /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.md \
  /home/demo/projects/Q-Peppa.github.io/docs/docs/latest/*.mdx 2>/dev/null | head -30
```

### 第 5 步：生成审核报告

汇总以下内容：

#### 报告模板

```markdown
## 审核报告：<文件名>

### 文件状态
- [ ] 文件完整
- [ ] 内容落后（源站有新增/修改内容未同步）
- [ ] 翻译增强（翻译比源站多了有用内容）
- [ ] 无对应源文件（翻译站独有的文件）

### 翻译质量
- [ ] 术语一致
- [ ] 机器翻译痕迹（如有，列出具体行号和原文）
- [ ] 不符合中文习惯的表述（如有，列出具体行号和原文）
- [ ] 代码/示例被错误翻译（如有，列出）

### 建议操作
- 不需要修改 / 需要更新 / 需要重译
```

#### 最终汇总表

| 文件 | 完整性 | 内容落后 | 翻译质量 | 操作建议 |
|------|--------|---------|---------|---------|
| index.mdx | ✅ | ✅ | ✅ | 无需修改 |
| settings.md | ⚠️ 缺失某章节 | ❌ 落后于源站 | ✅ | 需补充 |
| ... | ... | ... | ... | ... |

### 第 6 步：如果修改了文件，重建并更新 sitemap

完成翻译修改后，务必重新构建网站并更新 sitemap：

```bash
cd /home/demo/projects/Q-Peppa.github.io
pnpm run build
```

这会自动执行：
1. `rspress build` —— 生成最新的 HTML
2. `node scripts/generate-sitemap.mjs` —— 扫描所有 .html 文件重新生成 sitemap

生成的产物在 `doc_build/` 目录下，包含：
- `sitemap.xml` —— 所有页面的索引，供搜索引擎爬取
- `robots.txt` —— 控制爬虫行为，指向 sitemap

提交变更时一并提交 `doc_build/sitemap.xml` 的更新。

## 目录约定

| 项目 | 路径 |
|------|------|
| 翻译站文档 | `/home/demo/projects/Q-Peppa.github.io/docs/docs/latest/` |
| 源站文档 | `/home/demo/pi-repo/packages/coding-agent/docs/` |
| 翻译站图片 | `/home/demo/projects/Q-Peppa.github.io/docs/public/images/` |
| 源站图片 | `/home/demo/pi-repo/packages/coding-agent/docs/images/` |
| 配置文件 | `/home/demo/projects/Q-Peppa.github.io/rspress.config.ts` |
| 源站 git remote | `https://github.com/earendil-works/pi.git`（`origin/main`） |
| 源站克隆方式 | 浅克隆（`--depth 1`），需先 `git pull` 再对比 |
