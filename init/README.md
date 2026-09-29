# Windows 重装后的 D 盘恢复

`init/setup.ps1` 用于在 Windows 重装后从官方来源重新下载安装工具，并在工具安装完成后启动 `windows-system-optimization` skill。

## 使用方式

先在普通 PowerShell 中执行只读审计：

```powershell
cd D:\workspace\carryon\carryon\init
.\setup.ps1 -Mode Audit
```

确认清单后，以管理员身份运行 PowerShell，恢复当前基线：

```powershell
.\setup.ps1 -Mode Restore -Tools current
```

连同 Tabby、Rancher Desktop 一起安装：

```powershell
.\setup.ps1 -Mode Restore -Tools all
```

只恢复部分工具：

```powershell
.\setup.ps1 -Mode Restore -Tools @("java", "maven", "vscode")
```

目标目录已存在时，脚本会逐项询问是否重新下载安装。重装系统时可显式添加 `-ForceReinstall`，一次确认重新安装全部所选工具：

```powershell
.\setup.ps1 -Mode Restore -Tools current -ForceReinstall
```

`-SkipExisting` 可跳过已有目录，`-SkipSystemOptimization` 可暂不启动最后的系统优化。若有工具安装失败，脚本会保留失败清单并暂不启动系统优化。

完整恢复 D 盘工具并应用固定的 Windows 11 desired-state：

```powershell
.\setup.ps1 -Mode Restore -Tools current -ForceReinstall -WindowsStateMode Apply
```

`-WindowsStateMode Audit` 是默认值，只读检查 Windows 状态；`Apply` 才会执行 Win11Debloat；`Verify` 只验证目标状态；`Skip` 完全跳过。

## 工具清单

| 分组 | 工具 | 当前参考版本 | 恢复目录 | 安装方式 |
|---|---|---:|---|---|
| 当前基线 | Git | 2.55.0.5 | `D:\Git` | winget 固定版本 |
| 当前基线 | JDK 8 | 8 主版本最新更新 | `D:\Java\openjdk\java-se-8u44-ri` | Adoptium 官方 ZIP |
| 当前基线 | JDK 11 | 11 主版本最新更新 | `D:\Java\openjdk\jdk-11.0.0.2` | Adoptium 官方 ZIP |
| 当前基线 | JDK 17 | 17 主版本最新更新 | `D:\Java\openjdk\jdk-17.0.0.1` | Adoptium 官方 ZIP |
| 当前基线 | JDK 21 | 21 主版本最新更新 | `D:\Java\openjdk\jdk-21` | Adoptium 官方 ZIP |
| 当前基线 | Maven | 3.9.16 | `D:\Maven\apache-maven-3.9.16` | Apache 官方 ZIP |
| 当前基线 | VS Code | 1.139.1 | `D:\Microsoft VS Code` | Microsoft 官方安装器 |
| 当前基线 | IntelliJ IDEA Ultimate | 2026.2.3 | `D:\JetBrains\IntelliJ IDEA 2026.2.3` | JetBrains 官方安装器 |
| 当前基线 | Clash Verge | 2.5.6 | `D:\Clash Verge` | winget 固定版本 |
| 当前基线 | CC Switch | 3.20.4 | `D:\CC Switch` | winget 固定版本 |
| 当前基线 | 阿里云盘 | 官方当前 Windows 版 | `D:\aDrive` | 从官方页面解析安装器 |
| 当前基线 | 搜狗输入法 | 官方当前 Windows 版 | `D:\SogouInput` | 从官方页面解析安装器，交互安装 |
| 当前基线 | 微信 | 官方当前 Windows 版 | `D:\Tencent\Wechat\Weixin` | 腾讯官方安装器，交互安装 |
| 可选保留 | Tabby | winget 当前稳定版 | `D:\Tabby` | winget |
| 可选保留 | Rancher Desktop | winget 当前稳定版 | `D:\Rancher` | winget |
| 不再管理 | ClashMi | - | - | 已由 Clash Verge 替代 |
| 不再管理 | DBeaver | - | - | 已移出初始化清单 |
| 不再管理 | ikuuu VPN | - | - | 已移出初始化清单 |

JDK 目录名保持不变，以兼容现有 VS Code 配置；重新安装时会下载对应主版本的当前 Temurin 更新版，而不是恢复历史旧补丁。

## 恢复边界

- 脚本负责下载安装、目标路径、环境变量、PATH、Maven 配置、VS Code 设置和 IntelliJ 启动配置。
- ZIP 工具重装前会把原目录改名为带时间戳的备份，不直接删除原目录。
- 搜狗输入法和微信使用交互式安装，需要在安装器中确认 D 盘路径。
- Git、JDK 和部分 winget 软件最终从 GitHub 下载。若重装后 GitHub 暂时不可达，可先启动保留在 `D:\Clash Verge` 的现有程序并恢复订阅，再运行完整恢复。
- Clash 订阅、CC Switch provider/API Key、应用账号、聊天数据、IDE 登录和许可证不写入仓库，也不会自动恢复。
- 安装器是否完整恢复注册表、服务、文件关联和开机启动，需要在重装后的 Windows 环境实际演练确认。
- 系统优化 skill 只负责重装后的 Windows 检查与逐项优化，不会把“优化”当成批量删除授权。
- `windows-state/policy.json` 固定 Win11Debloat 版本、校验值、保守 tweak 和必须保留的内置 App；完整说明见 `windows-state/README.md`。
