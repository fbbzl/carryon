# Windows 11 desired state

该目录负责恢复 Windows 11 原有组件状态，不安装 PowerToys、启动器、任务栏 Mod 等功能性组件。

## 模式

```powershell
.\Invoke-WindowsState.ps1 -Mode Audit
.\Invoke-WindowsState.ps1 -Mode Apply
.\Invoke-WindowsState.ps1 -Mode Verify
```

- `Audit`：只读显示 Windows 版本、必须保留的 App、固定 tweak 和保护列表。
- `Apply`：下载固定版本 Win11Debloat，校验 SHA-256，补回必须存在的 App，创建还原点后应用策略。
- `Verify`：重新下载并校验固定版本，确认必须存在的 App 已安装、默认安全删除的 Appx/winget 软件已不存在。

## 安全边界

- 固定 Win11Debloat `2026.08.24`，不执行在线 `irm | iex`。
- 使用固定 SHA-256 校验下载包。
- 只使用上游固定版本中标记为默认、安全的 App 删除集合。
- Microsoft Store、Edge、Defender UI、App Installer、Windows Notepad、Windows Terminal 位于保护列表。
- 不关闭 Defender、Windows Update、VBS、BitLocker、通知或定位。
- 注册表备份与系统还原点由 Win11Debloat 创建；日志写入 `%ProgramData%\carryon\windows-state`。
- App 安装与移除状态由脚本独立验证；注册表 tweak 以固定参数、Win11Debloat 退出码和日志作为执行证据，不声称逐注册表值完成独立验证。
- `policy.json` 是唯一 desired-state 策略入口，修改后应重新执行 `Audit`。
