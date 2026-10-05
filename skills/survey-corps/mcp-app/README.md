# SC Agent Tree MCP App

这是项目内、零依赖的 Node stdio MCP server。它不是常驻服务：宿主在需要时启动 `server.js`，并通过 `show_sc_task_view` 传入当前 SC snapshot。工具以 `_meta.ui.resourceUri` 绑定静态 `text/html;profile=mcp-app` resource，并返回 `structuredContent.snapshot`；UI 通过 MCP Apps 的 `ui/notifications/tool-result` bridge 渲染该快照。

## 本地验证

```powershell
node .\skills\survey-corps\mcp-app\test-server.js
node .\skills\survey-corps\mcp-app\test-cr-contract.js
node .\skills\survey-corps\mcp-app\test-plugin-structure.js
```

## 注册（需用户自行授权）

本仓库不会改写 Codex 配置，也不会代为安装。安装前请确认 Codex Desktop 支持本地 marketplace plugin 与 MCP Apps；随后由用户自行从仓库根目录的 `.agents/plugins/marketplace.json` 的 `source: { "source": "local", "path": "./skills/survey-corps/mcp-app" }` 选择 `survey-corps-task-view`。该 path 相对 marketplace root（仓库根）解析。安装配置使用 `node`、plugin cwd 和相对 `server.js`，不依赖本机绝对路径。不要使用 `codex mcp add` 注册同名 server；若用户配置中已有同名旧项，应先由用户自行移除或改名，避免冲突。

marketplace 将该插件标为 `AVAILABLE`、`ON_INSTALL` 和 `Productivity`；这些字段控制客户端的发现与安装流程，不构成运行时隔离保证。

注册的具体配置键由客户端版本决定；完成注册后调用 `show_sc_task_view`，参数为 `{ "snapshot": <当前 SC 快照> }`。资源 URI 为 `ui://survey-corps/task-view`。

## 安全与边界

- 输入仅接受 JSON object，限制为 256 KiB；所有快照值由原模板以 `textContent` 输出。
- server 本身不联网、不写入、不保存快照、无轮询或后台服务；marketplace 元数据不是运行时隔离保证。
- 工具展示不改变 SC 权威状态、交接或完成门禁。
- 已在当前验证环境完成 MCP App 注册与工具调用验收；`show_sc_task_view` 状态更新调用成功并返回 `structuredContent.snapshot`。不同 Codex Desktop 版本仍需单独确认宿主面板的视觉渲染。
