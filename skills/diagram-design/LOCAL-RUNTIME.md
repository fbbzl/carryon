# 本机运行

本目录包含完整上游 skill、脚本、示例、参考资料和许可证，不依赖 MCP。
HTML 可直接在浏览器打开；SVG 导出与三种格式导入仅需 Python 标准库。
PNG 导出需要 Python Playwright 和可用浏览器。

## 当前 Windows 环境

在 PowerShell 中，从 `D:\workspace\kyojin` 执行：

```powershell
$diagramPython = Join-Path $env:LOCALAPPDATA 'kyojin/diagram-design/venv/Scripts/python.exe'
& $diagramPython skills/diagram-design/scripts/self_check.py skills/diagram-design/assets/example-architecture.html
& $diagramPython skills/diagram-design/scripts/export_svg.py skills/diagram-design/assets/example-architecture.html "$env:TEMP/diagram-architecture.svg" --system-fonts
& $diagramPython skills/diagram-design/scripts/export_png.py skills/diagram-design/assets/example-architecture.html "$env:TEMP/diagram-architecture.png" --browser-channel chrome
```

虚拟环境放在工作区外，已安装 Playwright 1.64.0。PNG 复用本机 Chrome，未安装额外 MCP。
这些本机依赖不随 Git 分发。其他机器需用可用 Python 创建 venv，再运行 `python -m pip install playwright`；有 Chrome/Edge 时使用对应 channel，否则运行 `python -m playwright install chromium` 后省略 channel。

HTML 示例包含在线字体引用；网络不可用时可能使用替代字体。SVG 的 `--system-fonts` 可用于离线导出。
文件放入项目目录不等于自动注册为 Codex 的全局 skill；本次只完成用户指定目录的迁入和运行验证。
