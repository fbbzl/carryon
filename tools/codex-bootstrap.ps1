[CmdletBinding()]
param(
  [ValidateSet("Install", "Update", "Uninstall")]
  [string]$Action = "Update",
  [string]$RepositoryUrl = "https://github.com/fbbzl/carryon.git",
  [string]$InstallRoot = (Join-Path $env:USERPROFILE ".codex\carryon")
)

$ErrorActionPreference = "Stop"
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

$lifecycle = Join-Path $InstallRoot "tools\codex-sctask-view.ps1"
if (-not (Test-Path -LiteralPath $lifecycle -PathType Leaf)) { throw "仓库缺少生命周期脚本：$lifecycle" }
& $lifecycle -Action $Action -RepositoryRoot $InstallRoot
