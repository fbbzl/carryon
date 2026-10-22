[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "High")]
param(
  [ValidateSet("Install", "Update", "Uninstall")]
  [string]$Action = "Update",
  [string]$RepositoryUrl = "https://github.com/fbbzl/kyojin.git",
  [string]$InstallRoot = (Join-Path $env:USERPROFILE ".codex\kyojin")
)

$ErrorActionPreference = "Stop"
$InstallRoot = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($InstallRoot)
if (-not $PSCmdlet.ShouldProcess($InstallRoot, "$Action 本地插件")) { return }
if ($Action -ne "Uninstall") {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if (-not $git) { throw "未找到 git，请先安装 Git。" }
  if (Test-Path -LiteralPath (Join-Path $InstallRoot ".git") -PathType Container) {
    & $git.Source -C $InstallRoot pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw "更新仓库失败，请先处理本地改动或网络问题。" }
  } else {
    $parent = Split-Path -Parent $InstallRoot
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    & $git.Source clone $RepositoryUrl $InstallRoot
    if ($LASTEXITCODE -ne 0) { throw "克隆仓库失败。" }
  }
}
$lifecycle = Join-Path $InstallRoot "tools\codex-sctask-view.ps1"
if ($Action -eq "Uninstall" -and -not (Test-Path -LiteralPath (Join-Path $InstallRoot ".agents\plugins\marketplace.json") -PathType Leaf)) {
  Write-Host "marketplace 中未找到插件注册：survey-corps-task-view@kyojin-local"
  return
}
if (-not (Test-Path -LiteralPath $lifecycle -PathType Leaf)) {
  if ($PSScriptRoot) { $lifecycle = Join-Path $PSScriptRoot "codex-sctask-view.ps1" }
  if (-not (Test-Path -LiteralPath $lifecycle -PathType Leaf)) { throw "仓库缺少生命周期脚本：$lifecycle" }
}
# The bootstrap owns confirmation, so the nested script must not prompt a second time.
& $lifecycle -Action $Action -RepositoryRoot $InstallRoot -Confirm:$false
