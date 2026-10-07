[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "High")]
param(
  [ValidateSet("Install", "Update", "Uninstall")]
  [string]$Action = "Update",
  [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path $RepositoryRoot).Path
$marketplacePath = Join-Path $root ".agents\plugins\marketplace.json"
$pluginPath = Join-Path $root "skills\survey-corps\mcp-app"
$manifestPath = Join-Path $pluginPath ".codex-plugin\plugin.json"
$testPath = Join-Path $pluginPath "test-server.js"
$pluginName = "survey-corps-task-view"
$pluginId = "$pluginName@carryon-local"

function Fail([string]$Message) { throw $Message }

if (-not (Test-Path -LiteralPath $marketplacePath -PathType Leaf)) { Fail "找不到 marketplace 清单：$marketplacePath" }
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { Fail "找不到插件 manifest：$manifestPath" }
if (-not (Test-Path -LiteralPath $testPath -PathType Leaf)) { Fail "找不到插件验证脚本：$testPath" }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail "未找到 node。请先安装 Node.js，再重新运行此脚本。" }

$marketplace = Get-Content -LiteralPath $marketplacePath -Raw -Encoding UTF8 | ConvertFrom-Json
$plugins = @($marketplace.plugins)
$entry = $plugins | Where-Object { $_.name -eq $pluginName }

function Save-Marketplace($Value) {
  $json = $Value | ConvertTo-Json -Depth 20
  [System.IO.File]::WriteAllText($marketplacePath, "$json`r`n", [System.Text.UTF8Encoding]::new($false))
}

function Run-Verification {
  Push-Location $pluginPath
  try {
    & $node.Source $testPath
    if ($LASTEXITCODE -ne 0) { Fail "插件验证失败，已停止。" }
  } finally { Pop-Location }
}

switch ($Action) {
  "Install" {
    if (-not $entry) {
      if ($PSCmdlet.ShouldProcess($marketplacePath, "注册 $pluginId")) {
        $marketplace.plugins = @($plugins + [pscustomobject]@{
          name = $pluginName
          source = [pscustomobject]@{ source = "local"; path = "./skills/survey-corps/mcp-app" }
          policy = [pscustomobject]@{ installation = "AVAILABLE"; authentication = "ON_INSTALL" }
          category = "Productivity"
        })
        Save-Marketplace $marketplace
      }
    } else {
      Write-Host "插件已注册：$pluginId"
    }
    Run-Verification
    Write-Host "安装检查完成。请在 Codex Desktop 重新加载 marketplace，并按客户端提示重启或重载插件。"
  }
  "Update" {
    if (-not $entry) { Fail "插件尚未注册。请先运行：-Action Install" }
    if ($entry.source.path -ne "./skills/survey-corps/mcp-app") { Fail "已存在同名插件，但路径不是本仓库，未自动覆盖：$($entry.source.path)" }
    Run-Verification
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    Write-Host "插件代码已验证：$pluginName@$($manifest.version)"
    Write-Host "请在 Codex Desktop 重新加载插件；若视图仍是旧版本，请重启 Codex。"
  }
  "Uninstall" {
    if (-not $entry) {
      Write-Host "marketplace 中未找到插件注册：$pluginId"
      break
    }
    if ($PSCmdlet.ShouldProcess($marketplacePath, "移除 $pluginId 的 marketplace 注册")) {
      $marketplace.plugins = @($plugins | Where-Object { $_.name -ne $pluginName })
      Save-Marketplace $marketplace
      Write-Host "已移除 marketplace 注册。源代码未删除。"
      Write-Host "请在 Codex Desktop 禁用/移除该插件，并按客户端提示重启或重载。"
    }
  }
}
