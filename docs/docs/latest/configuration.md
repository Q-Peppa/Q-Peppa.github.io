# 配置

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/configuration) 的中文翻译。仅供学习参考。

Pi 支持用户级和项目级配置。用户级配置位于 agent 目录，默认为 `~/.pi/agent`。项目级配置位于工作目录下的 `.pi`，在[项目信任](security.md#understand-project-trust)被授予后加载。唯一的例外是 `sessionDir`，Pi 在确定信任之前就读取它，以便定位会话。

在交互模式下，用 `/settings` 修改常用偏好。其他选项可以让 Pi 更新配置，或直接编辑相应文件。手动修改设置、快捷键、指令或资源后运行 `/reload`。

## Agent 目录

下面用 `<agent-dir>` 表示 agent 目录。用 `PI_CODING_AGENT_DIR` 环境变量或 SDK 的 [`agentDir`](sdk.md) 选项设置它的位置。

| 路径                                                                                   | 作用                                                                    |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `<agent-dir>/settings.json`                                                            | 用户级[设置](settings.md)，包括偏好、默认值、资源路径和 Pi 包声明。     |
| `<agent-dir>/keybindings.json`                                                         | 自定义终端 UI 和应用[快捷键](keybindings.md)。                          |
| `<agent-dir>/models.json`                                                              | [兼容端点、模型和模型覆盖](models.md#configure-a-compatible-endpoint)。 |
| `<agent-dir>/auth.json`                                                                | 已保存的 API Key 和 OAuth 凭证。                                        |
| `<agent-dir>/AGENTS.override.md`、`AGENTS.md`、`AGENTS.MD`、`CLAUDE.md` 或 `CLAUDE.MD` | 跨工作目录生效的用户指令。                                              |
| `<agent-dir>/SYSTEM.md`                                                                | 替换 Pi 的默认系统提示。                                                |
| `<agent-dir>/APPEND_SYSTEM.md`                                                         | 向 Pi 的系统提示追加指令。                                              |
| `<agent-dir>/extensions/`                                                              | 用户[扩展](extensions.md)。                                             |
| `<agent-dir>/skills/`                                                                  | 用户 [Skill](skills.md) 和配套文件。                                    |
| `<agent-dir>/prompts/`                                                                 | 作为斜杠命令暴露的用户 [Prompt 模板](prompt-templates.md)。             |
| `<agent-dir>/themes/`                                                                  | 用户[主题](themes.md)文件。                                             |

## 项目 `.pi` 目录

| 路径                   | 作用                                              |
| ---------------------- | ------------------------------------------------- |
| `.pi/settings.json`    | 项目级[设置](settings.md)、资源路径和 Pi 包声明。 |
| `.pi/SYSTEM.md`        | 替换该项目的系统提示。                            |
| `.pi/APPEND_SYSTEM.md` | 向系统提示添加项目专用指令。                      |
| `.pi/extensions/`      | 项目扩展。                                        |
| `.pi/skills/`          | 项目 Skill 和配套文件。                           |
| `.pi/prompts/`         | 作为斜杠命令暴露的项目 Prompt 模板。              |
| `.pi/themes/`          | 项目主题文件。                                    |

对于 `SYSTEM.md` 和 `APPEND_SYSTEM.md`，受信任的项目文件优先于 agent 目录中对应的文件。同名文件不会合并。

## 上下文文件

上下文文件与项目 `.pi` 配置相互独立。Pi 从 agent 目录、工作目录及其父目录加载它们。只要 Pi 运行在该文件所在目录或其下任意位置，该上下文文件就生效。

`AGENTS.override.md` 只替换同一目录中的 `AGENTS.md` 或 `CLAUDE.md`。它不会抑制 agent 目录或其他目录中的上下文文件。

上下文文件的发现不需要项目信任。

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
