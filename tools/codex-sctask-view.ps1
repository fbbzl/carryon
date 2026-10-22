[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "High")]
param(
  [ValidateSet("Install", "Update", "Uninstall")]
  [string]$Action = "Update",
  [string]$RepositoryRoot
)

$ErrorActionPreference = "Stop"
if (-not $RepositoryRoot) { $RepositoryRoot = Split-Path -Parent $PSScriptRoot }
$root = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($RepositoryRoot)
$marketplacePath = Join-Path $root ".agents\plugins\marketplace.json"
$pluginPath = Join-Path $root "skills\survey-corps\mcp-app"
$manifestPath = Join-Path $pluginPath ".codex-plugin\plugin.json"
$testPath = Join-Path $pluginPath "test-server.js"
$pluginName = "survey-corps-task-view"
$pluginId = "$pluginName@kyojin-local"

function Fail([string]$Message) { throw $Message }
function Save-Marketplace($Value) {
  $serializationWarnings = @()
  $json = $Value | ConvertTo-Json -Depth 100 -WarningAction SilentlyContinue -WarningVariable serializationWarnings
  if ($serializationWarnings.Count -gt 0) { Fail "marketplace 包含超过可安全保存深度的注册，未修改。" }
  [System.IO.File]::WriteAllText($marketplacePath, "$json`r`n", [System.Text.UTF8Encoding]::new($false))
}
function Run-Verification {
  Push-Location $pluginPath
  try {
    & $node.Source $testPath
    if ($LASTEXITCODE -ne 0) { Fail "插件验证失败，已停止。" }
  } finally { Pop-Location }
}

# Unregistration needs only its local marketplace, even when plugin dependencies are gone.
if (-not (Test-Path -LiteralPath $marketplacePath -PathType Leaf)) {
  if ($Action -eq "Uninstall") { Write-Host "marketplace 中未找到插件注册：$pluginId"; return }
  Fail "找不到 marketplace 清单：$marketplacePath"
}
$marketplace = Get-Content -LiteralPath $marketplacePath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($marketplace -isnot [pscustomobject] -or $marketplace.name -cne "kyojin-local" -or $marketplace.plugins -isnot [array]) {
  Fail "marketplace 标识或 plugins 数组无效，未修改。"
}
$plugins = @($marketplace.plugins)
$entries = @($plugins | Where-Object { $_.name -eq $pluginName })
if ($entries.Count -gt 1) { Fail "marketplace 中存在重复的同名插件，未修改。" }
$entry = if ($entries.Count) { $entries[0] } else { $null }
if ($entry -and ($entry.name -cne $pluginName -or $entry.source.source -cne "local" -or $entry.source.path -cne "./skills/survey-corps/mcp-app")) {
  Fail "已存在同名插件，但来源或路径不是本仓库，未自动覆盖。"
}
if ($Action -eq "Uninstall") {
  if (-not $entry) { Write-Host "marketplace 中未找到插件注册：$pluginId"; return }
  if ($PSCmdlet.ShouldProcess($marketplacePath, "移除 $pluginId 的 marketplace 注册")) {
    $marketplace.plugins = @($plugins | Where-Object { $_.name -ne $pluginName })
    Save-Marketplace $marketplace
    Write-Host "已移除 marketplace 注册。源代码未删除。"
    Write-Host "请在 Codex Desktop 禁用/移除该插件，并按客户端提示重启或重载。"
  }
  return
}

if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { Fail "找不到插件 manifest：$manifestPath" }
if (-not (Test-Path -LiteralPath $testPath -PathType Leaf)) { Fail "找不到插件验证脚本：$testPath" }
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail "未找到 node。请先安装 Node.js，再重新运行此脚本。" }
if ($Action -eq "Update" -and -not $entry) { Fail "插件尚未注册。请先运行：-Action Install" }
if ($Action -eq "Install" -and -not $PSCmdlet.ShouldProcess($marketplacePath, "验证并注册 $pluginId")) { return }
Run-Verification
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($Action -eq "Install") {
  if (-not $entry) {
    $marketplace.plugins = @($plugins + [pscustomobject]@{
      name = $pluginName
      source = [pscustomobject]@{ source = "local"; path = "./skills/survey-corps/mcp-app" }
      policy = [pscustomobject]@{ installation = "AVAILABLE"; authentication = "ON_INSTALL" }
      category = "Productivity"
    })
    Save-Marketplace $marketplace
  } else { Write-Host "插件已注册：$pluginId" }
  Write-Host "安装检查完成。请在 Codex Desktop 重新加载 marketplace，并按客户端提示重启或重载插件。"
} else {
  Write-Host "插件代码已验证：$pluginName@$($manifest.version)"
  Write-Host "请在 Codex Desktop 重新加载插件；若视图仍是旧版本，请重启 Codex。"
}
