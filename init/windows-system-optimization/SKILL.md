---
name: windows-system-optimization
description: "Use after init/setup.ps1 restores the D-drive development environment to safely inspect and optimize a newly installed Windows system, including updates, built-in apps, startup items, notifications, Bluetooth audio, and multi-monitor behavior."
metadata:
  version: 1.0.0
  type: agent-skill
  scope: windows-initialization
  tags: [windows, initialization, optimization, recovery]
  author: carryon
---

# Windows 重装后优化

本 skill 由 `init/setup.ps1` 在 D 盘开发环境初始化完成后安装并启动。开发工具恢复由初始化脚本负责；本 skill 聚焦 Windows 系统状态、无用软件、内置功能、弹窗和设备体验问题。

## 执行原则

- 先只读盘点 Windows 版本、激活、更新、设备状态、已安装应用、启动项和当前异常，再提出分组建议。
- 将每项建议标为“保留”“低风险设置”“确认后修改”“不建议处理”，说明目的、影响和恢复方法。
- 删除文件、卸载应用或系统组件、修改注册表/服务/策略、关闭安全功能、清理旧系统文件、重置设备及重启前，必须取得用户对该具体操作的明确同意。
- 一次只执行一组已确认的有限变更，随后验证结果。不得把用户要求“优化”解释为批量精简授权。
- 优先使用 Windows 设置、系统自带工具和应用自身支持的选项。避免来源不明的优化脚本、注册表包、驱动工具和清理软件。
- 不关闭 Windows Update、防火墙、Defender 或恢复能力来换取少量资源；不把 `Downloads`、回收站、旧系统文件或未知目录默认视为垃圾。
- 需要外部资料时，优先使用 Microsoft、设备厂商或软件官方来源，并核对当前 Windows 版本与设备型号。

## 执行顺序

### 1. 基础状态

- 检查 Windows 激活、待安装更新、待重启状态、设备管理器异常、安全防护和系统盘空间。
- 驱动优先使用 Windows Update 或设备厂商官方渠道；不要使用第三方驱动聚合工具。
- 确认 `init/setup.ps1` 已结束。可只读验证 D 盘工具和环境变量，但不要未经请求重复安装或覆盖开发环境。

### 2. 软件与启动项

- 盘点已安装软件、发布者、安装位置、启动项和后台权限，按用途分类后让用户选择。
- 对不认识的软件先核实发布者和依赖，不按名称猜测用途，不自动卸载。
- Microsoft Store、Xbox/Game Bar、Edge 等内置组件先说明依赖和可恢复方式，优先关闭通知、后台运行或入口；不承诺强制移除 Edge 等系统依赖组件。

### 3. 通知与弹窗

- 先识别弹窗发布者、触发条件、通知来源和启动入口。
- 优先关闭对应应用通知、推荐内容或启动项，不因来源不明而直接禁用服务、安全告警或系统更新。

### 4. 设备体验

- 蓝牙音量问题先区分最大音量过大、步进过粗、应用独立音量和左右不平衡，再检查输出设备、音量混合器、增强选项、固件与驱动。
- 多显示器图标问题先检查显示布局、缩放、分辨率、主显示器、自动排列和显卡驱动。修改注册表或重建图标缓存前记录当前值和恢复方法。
- 每次只改变一个变量，并在变更后复现原问题。

### 5. 空间与收尾

- 使用 Windows 临时文件或存储管理功能盘点可清理内容，展示类别、路径和预计空间。
- 结束时汇总完成项、跳过项、待决定项、需要重启的项目和残余风险；不声称未经验证的优化效果。

## 完成标准

- Windows 更新、安全与设备状态无未说明的关键异常。
- 用户选定的软件、启动项、通知和设备问题均已处理或明确保留。
- 每项系统改动均有用户授权、验证结果和可执行的恢复办法。
