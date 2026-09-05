# Development（开发）

> 本页面是 [Pi 官方文档](https://pi.dev/docs/latest/development) 的中文翻译。仅供学习参考。

请参阅 [AGENTS.md](https://github.com/earendil-works/pi-mono/blob/main/AGENTS.md) 获取更多指南。

## 设置

```bash
git clone https://github.com/earendil-works/pi-mono
cd pi-mono
npm install
npm run build
```

从源码运行：

```bash
/path/to/pi-mono/pi-test.sh
```

该脚本可从任何目录运行，Pi 保留调用者的当前工作目录。

### 实验性远程 Harness

远程 Harness 服务端/客户端集成仅用于开发环境。在仓库中运行：

```bash
PI_EXPERIMENTAL=1 ./pi-test.sh server
PI_EXPERIMENTAL=1 ./pi-test.sh client
```

`PI_SERVER_DIR` 覆盖服务端配置文件和套接字目录（默认：`~/.pi/server`）。当省略 `--server-id` 时，`PI_SERVER_ID` 选择逻辑服务端 ID。

`client` 和 `experimental/plugin` 包子路径仅在本地检出的 `source` 条件下解析。它们的实现及 server/client 命令均已从 npm 包和独立二进制文件中排除。`pi-client`、`pi-protocol` 和 `pi-server` 是 coding-agent 的开发依赖，而非运行时依赖。本地 SDK 和 stdio RPC API 保持不变。

## Forking / Rebranding

通过 `package.json` 配置：

```json
{
  "piConfig": {
    "name": "pi",
    "configDir": ".pi"
  }
}
```

更改 `name`、`configDir` 和 `bin` 字段会影响你的分支版本。影响 CLI 横幅、配置路径和环境变量名。

## 路径解析

三种执行模式：npm install、独立二进制和 tsx（从源码）。

**始终使用 `src/config.ts`** 访问包资源：

```typescript
import { getPackageDir, getThemeDir } from './config.js';
```

切勿直接使用 `__dirname` 访问包资源。

## Debug 命令

`/debug`（隐藏命令）将调试日志写入 `~/.pi/agent/pi-debug.log`，捕获：

- 带 ANSI 码的已渲染 TUI 行
- 发送给 LLM 的最后消息

## 测试

```bash
./test.sh                    # 运行非 LLM 测试（不需要 API Key）
npm test                     # 运行所有测试
npm test -- test/specific.test.ts  # 运行特定测试文件
```

### 发布包冒烟测试

构建完成后，运行 `npm run check:package-install`。它会打包公开包，并在仓库外部的临时目录中仅将 coding-agent 作为直接依赖安装。本地 tarball 覆盖规则会选择已声明的传递依赖，而不会安装仅限开发的包。该检查在无需凭证或模型请求的情况下验证 SDK 导入和 CLI 启动。

`npm run check` 还会检查运行时依赖声明，并拒绝通过 import 引入包构建中的被排除开发源码。

## 项目结构

```
packages/
  ai/           # LLM Provider 抽象
  agent/        # Agent 循环和消息类型
  tui/          # 终端 UI 组件
  coding-agent/ # CLI 和交互模式
```

---

> **法律声明**：本页面是 pi.dev 官方文档的中文翻译版本，仅供学习参考。本网站与 [pi.dev](https://pi.dev/) 及 Earendil Inc. 无任何法律关系。
