# 用 NVIDIA RTX 和 llama.cpp 运行 Pi

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/nvidia-rtx-llama-cpp) 的中文翻译。仅供学习参考。

[NVIDIA Local AI Inference Recipes](https://nvidia.github.io/local-ai-inference-recipes/index.html) 提供针对特定 NVIDIA 硬件和模型调优的 llama.cpp 设置。每个 recipe 给出单模型的 `llama-server` 命令。Pi 使用 llama.cpp router，它可以提供并管理多个模型，所以本指南把 recipe 命令转换成 router 预设。

下面的示例使用 Windows PowerShell。Pi 完整的 router 和模型管理参考见[用 llama.cpp 运行本地模型](llama-cpp.md)。

## 开始之前

1. 打开 [recipe 目录](https://nvidia.github.io/local-ai-inference-recipes/index.html)，选择你的硬件、操作系统和模型，然后选 **llama.cpp**。检查前置条件和内存要求。保留下 recipe 的启动命令，供下面的转换使用。
2. 按 recipe 的安装说明安装 llama.cpp。recipe 的设置依赖它的构建，例如 CUDA 支持或投机解码选项。
3. 运行 `llama-server --help`，确认它列出了 `--models-preset`。如果没有，该构建无法把 recipe 作为 router 预设加载。使用仍满足 recipe 要求的更新的构建。
4. 按[快速开始](quickstart.md)安装 Pi。在原生 Windows 上，另见[在 Windows 上运行 Pi](windows.md)。

## 把 recipe 转换成预设

一个预设列出一个或多个模型的设置。每个小节名会成为 Pi 中显示的模型 ID。把预设保存在 `llama-server` 旁边，或者在启动 router 时传入它的完整路径。

把 recipe 命令中的每个选项转换成一行预设：

- 去掉开头的短横线：`--ctx-size 65536` 变成 `ctx-size = 65536`。
- 没有值的选项写成 `true`：`--jinja` 变成 `jinja = true`。
- 去掉值周围的引号和 PowerShell 续行反引号。
- 省略 `--host` 和 `--port`。它们属于 router 命令行。
- 添加 `load-on-startup = true`，让 router 在启动时加载模型。
- 把短的模型文件选项替换为对应的长预设键：

| Recipe 选项          | 预设键             |
| -------------------- | ------------------ |
| `-hf`                | `hf-repo`          |
| `-hff`               | `hf-file`          |
| `-hfrd`              | `hf-repo-draft`    |
| `--spec-draft-model` | `spec-draft-model` |

例如，这个 recipe 命令：

```powershell
llama-server.exe -hf "unsloth/Qwen3.8-27B-GGUF" `
  -hff "Qwen3.8-27B-UD-Q4_K_M.gguf" `
  -hfrd "z-lab/Qwen3.8-27B-DFlash2-GGUF" `
  --spec-draft-model "Qwen3.8-27B-DFlash2-Q4_K_M.gguf" `
  --no-mmproj `
  --host 127.0.0.1 `
  --port 9931 `
  --batch-size 4096 `
  --ubatch-size 1024 `
  --ctx-size 65536 `
  --parallel 1 `
  -ngl 999 `
  --jinja `
  --chat-template-kwargs '{"preserve_thinking":true}' `
  --spec-type draft-dflash `
  --spec-draft-n-max 7 `
  --spec-draft-backend-sampling
```

变成 `qwen3.8-27b.ini`：

```ini
version = 1

[qwen3.8-27b]
load-on-startup = true
hf-repo = unsloth/Qwen3.8-27B-GGUF
hf-file = Qwen3.8-27B-UD-Q4_K_M.gguf
hf-repo-draft = z-lab/Qwen3.8-27B-DFlash2-GGUF
spec-draft-model = Qwen3.8-27B-DFlash2-Q4_K_M.gguf
no-mmproj = true
batch-size = 4096
ubatch-size = 1024
ctx-size = 65536
parallel = 1
ngl = 999
jinja = true
chat-template-kwargs = {"preserve_thinking":true}
spec-type = draft-dflash
spec-draft-n-max = 7
spec-draft-backend-sampling = true
```

## 启动 router

在 llama.cpp 文件夹中打开 PowerShell 并运行：

```powershell
.\llama-server.exe --models-preset qwen3.8-27b.ini --host 127.0.0.1 --port 8080
```

如果 recipe 需要 Hugging Face Token，在启动 router 前在同一个 PowerShell 窗口中设置 `$env:HF_TOKEN`。首次启动时，router 会下载模型文件。

用 [router 健康检查](llama-cpp.md#troubleshooting)确认服务器已就绪。在 Windows PowerShell 中，使用 `curl.exe` 而不是 `curl`，后者被 PowerShell 映射到另一个命令。当 `/models` 列出 `qwen3.8-27b` 且状态为 `loaded` 时，模型就绪。

## 在 Pi 中使用模型

遵循[配置 Pi](llama-cpp.md#configure-pi)，连接到 `http://127.0.0.1:8080`。预设小节名就是模型 ID，所以本示例在 `/model` 中选择 `qwen3.8-27b`。

NVIDIA recipe 的内存设置假定只有选中的模型使用 GPU。如果 `/llama` 显示其他已加载的模型，在使用 recipe 模型前卸载它们。
