# 斜杠命令

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/slash-commands) 的中文翻译。仅供学习参考。

在 Pi 的终端编辑器中输入 `/` 可以搜索当前会话可用的命令。本页列出当前 Pi 版本中的内置命令。

扩展、Prompt 模板和 Skill 都可以添加命令。因此 Pi 中的命令菜单才是你当前会话已加载资源的准确参考。

## 模型与设置

| 命令                      | 说明                                   |
| ------------------------- | -------------------------------------- |
| `/settings`               | 打开设置                               |
| `/model [provider/model]` | 选择模型                               |
| `/thinking [level]`       | 设置 thinking level                    |
| `/scoped-models`          | 配置交互式循环使用的模型               |
| `/login [provider]`       | 添加 Provider 认证                     |
| `/logout`                 | 移除 Provider 认证                     |
| `/llama`                  | 管理已配置的 llama.cpp router 上的模型 |

## 会话与上下文

| 命令                      | 说明                                 |
| ------------------------- | ------------------------------------ |
| `/new`                    | 开始新会话                           |
| `/resume`                 | 切换到另一个已保存的会话             |
| `/name [name]`            | 设置会话显示名，省略时显示当前名称   |
| `/session`                | 显示当前会话信息和统计               |
| `/tree`                   | 在会话树中导航                       |
| `/fork`                   | 从更早的用户消息创建新会话           |
| `/clone`                  | 在当前位置复制当前会话               |
| `/compact [instructions]` | 压缩当前上下文，可选地附加自定义指令 |
| `/import <path>`          | 导入并恢复一个 JSONL 会话            |

## 导出与分享

| 命令                 | 说明                              |
| -------------------- | --------------------------------- |
| `/copy`              | 复制最后一条 assistant 消息       |
| `/export [path]`     | 把会话导出为 HTML 或 JSONL        |
| `/share`             | 上传会话并返回查看链接            |
| `/bug [description]` | 为 Pi 开发者准备一份私有 bug 报告 |

导出或分享会话之前请先审阅。会话可能包含 Prompt、工具参数、命令输出、文件内容和对话期间暴露的凭证。

## 运行时与项目

| 命令         | 说明                                                |
| ------------ | --------------------------------------------------- |
| `/trust`     | 为未来的 Pi 进程保存项目信任决策                    |
| `/reload`    | 重新加载快捷键、扩展、Skill、模板、主题和上下文文件 |
| `/hotkeys`   | 显示当前生效的键盘快捷键                            |
| `/changelog` | 显示 changelog 条目                                 |
| `/quit`      | 退出 Pi                                             |

## 资源添加的命令

- 扩展可以注册带自己的参数和补全行为的命令。
- 每个 Prompt 模板都以它的模板名可用。
- 启用 Skill 命令时，Skill 以 `/skill:name` 可用。

添加或修改已发现的命令资源后，请使用 `/reload`。它们的加载和命名规则见[扩展](extensions.md)、[Prompt 模板](prompt-templates.md)和 [Skill](skills.md)。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
