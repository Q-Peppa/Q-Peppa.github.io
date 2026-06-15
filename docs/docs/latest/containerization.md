# 容器化

Pi 默认以所有权限运行，但在某些情况下，你可能需要更精细地控制 Pi 可以写入的目录以及它拥有的访问权限。

有两种通用方案。你可以：

1. 在隔离环境中运行整个 `pi` 进程，或
2. 在主机上运行 `pi`，并将工具执行路由到隔离环境中。

## 选择方案

| 方案          | 隔离对象                         | 适用场景                             | 备注                                                                                                                  |
| ------------- | -------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Gondolin 扩展 | 内置工具和 `!` 命令              | 本地 micro-VM 隔离，同时保留主机认证 | 参见 [`examples/extensions/gondolin/`](https://github.com/earendil-works/pi/tree/main/examples/extensions/gondolin)。 |
| 普通 Docker   | 整个 `pi` 进程在本地容器中       | 简单的本地隔离                       | Provider API 密钥会进入容器。                                                                                         |
| OpenShell     | 整个 `pi` 进程在策略控制的沙箱中 | 本地或远程托管沙箱                   | 需要 OpenShell 网关                                                                                                   |

扩展在 `pi` 进程运行的位置执行。如果你在主机上运行带工具路由扩展的 `pi`，其他自定义扩展工具仍在主机上运行，除非它们也委托其操作。

## Gondolin

[Gondolin](https://github.com/earendil-works/gondolin) 是一个本地 Linux micro-VM。
当你想在主机上运行 `pi` 但将所有内置工具路由到 VM 中时，使用[示例扩展](https://github.com/earendil-works/pi/tree/main/examples/extensions/gondolin)。

设置：

```bash
cp -R packages/coding-agent/examples/extensions/gondolin ~/.pi/agent/extensions/gondolin
cd ~/.pi/agent/extensions/gondolin
npm install --ignore-scripts
```

从你希望挂载的项目运行：

```bash
cd /path/to/project
pi -e ~/.pi/agent/extensions/gondolin
```

该扩展将主机的当前工作目录挂载到 VM 的 `/workspace`，并覆盖 `read`、`write`、`edit`、`bash`、`grep`、`find` 和 `ls`。
用户的 `!` 命令也会被路由到 VM 中。
`/workspace` 下的文件变更会直接写入主机。

要求：Node.js >= 23.6.0 以运行 `@earendil-works/gondolin`，以及 QEMU（需要通过包管理器安装）。

## 普通 Docker

当你想要最简单的本地容器边界时，在 Docker 中运行整个 `pi` 进程。

`Dockerfile.pi`：

```dockerfile
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent

WORKDIR /workspace
ENTRYPOINT ["pi"]
```

构建并运行：

```bash
docker build -t pi-sandbox -f Dockerfile.pi .

docker run --rm -it \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v pi-agent-home:/root/.pi/agent \
  pi-sandbox
```

`-v "$PWD:/workspace"` 将你当前目录挂载到容器的 /workspace，这样 Docker 内 `/workspace` 中的读写操作会直接影响你主机上的文件，与 Gondolin 示例类似。

如果你想使用容器本地的设置和会话，请为 `/root/.pi/agent` 使用命名卷。挂载你主机的 `~/.pi/agent` 会将主机认证和会话文件暴露给容器。

## OpenShell

当你需要一个带有文件系统、进程、网络、凭证和推理控制的策略控制沙箱时，使用 [NVIDIA OpenShell](https://docs.nvidia.com/openshell/about/overview)。
OpenShell 可以通过 Docker、Podman 或 VM 运行时支持的本地网关运行沙箱，也可以通过远程 Kubernetes 网关运行。

每个沙箱都需要一个活跃的网关。
在创建沙箱之前注册并选择一个：

```bash
openshell gateway add <gateway-url> --name <name>
openshell gateway select <name>
```

在 OpenShell 沙箱中启动 `pi`：

```bash
openshell sandbox create --name pi-sandbox --from pi -- pi
```

在这种方案下，整个 `pi` 进程在沙箱内运行。
内置工具、`!` 命令和扩展工具在 OpenShell 边界内执行。

如果网关是远程的，项目文件不会从主机绑定挂载，这意味着沙箱内的写操作不会反映到你的机器上。
在沙箱内克隆仓库或使用 OpenShell 文件传输命令：

```bash
openshell sandbox upload pi-sandbox ./repo /workspace
openshell sandbox download pi-sandbox /workspace/repo ./repo-out
```

OpenShell Provider 可以将原始模型 API 密钥保持在沙箱外。
配置推理路由后，沙箱内的代码可以调用 `https://inference.local`，网关会在上游注入已配置的 Provider 凭证。
如果你想让模型流量使用此路由，请配置 Pi 使用相应的 OpenAI 兼容或 Anthropic 兼容端点。
