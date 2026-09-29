# Windows 11 desired-state orchestration for carryon init.

param(
    [ValidateSet("Audit", "Apply", "Verify")]
    [string]$Mode = "Audit",
    [string]$PolicyPath = (Join-Path $PSScriptRoot "policy.json")
)

$ErrorActionPreference = "Stop"

function Write-Status($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[OK] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARN] $message" -ForegroundColor Yellow }
function Write-Failure($message) { Write-Host "[ERROR] $message" -ForegroundColor Red }

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Assert-NonEmptyString($value, $fieldName) {
    if (-not ($value -is [string]) -or [string]::IsNullOrWhiteSpace($value)) {
        throw "策略字段必须是非空字符串: $fieldName"
    }
}

function Assert-UniqueStringList($values, $fieldName) {
    $items = @($values)
    if ($items.Count -eq 0) {
        throw "策略字段不能为空: $fieldName"
    }
    foreach ($item in $items) {
        Assert-NonEmptyString $item $fieldName
    }
    $duplicates = @($items | Group-Object { $_.ToLowerInvariant() } | Where-Object Count -gt 1)
    if ($duplicates.Count -gt 0) {
        throw "策略字段包含重复值: $fieldName"
    }
}

function Test-Policy($policy) {
    if ($null -eq $policy) { throw "策略内容为空" }
    if ($policy.schemaVersion -ne 1) {
        throw "不支持的策略版本: $($policy.schemaVersion)"
    }
    if ($null -eq $policy.win11Debloat) { throw "策略缺少 win11Debloat" }

    Assert-NonEmptyString $policy.win11Debloat.version "win11Debloat.version"
    Assert-NonEmptyString $policy.win11Debloat.downloadUrl "win11Debloat.downloadUrl"
    Assert-NonEmptyString $policy.win11Debloat.sha256 "win11Debloat.sha256"
    if ($policy.win11Debloat.sha256 -notmatch '^[0-9a-fA-F]{64}$') {
        throw "win11Debloat.sha256 必须是 64 位十六进制 SHA-256"
    }
    if (-not ($policy.win11Debloat.useDefaultSafeAppRemoval -is [bool])) {
        throw "win11Debloat.useDefaultSafeAppRemoval 必须是布尔值"
    }
    Assert-UniqueStringList $policy.win11Debloat.tweaks "win11Debloat.tweaks"

    try {
        $downloadUri = [Uri]$policy.win11Debloat.downloadUrl
    } catch {
        throw "win11Debloat.downloadUrl 不是有效 URL"
    }
    $expectedPath = "/Raphire/Win11Debloat/zip/refs/tags/$($policy.win11Debloat.version)"
    if (-not $downloadUri.IsAbsoluteUri -or
        $downloadUri.Scheme -cne "https" -or
        $downloadUri.Host -cne "codeload.github.com" -or
        $downloadUri.AbsolutePath -cne $expectedPath) {
        throw "win11Debloat.downloadUrl 必须指向固定版本的 codeload.github.com 地址"
    }

    $requiredApps = @($policy.requiredApps)
    if ($requiredApps.Count -eq 0) { throw "策略字段不能为空: requiredApps" }
    foreach ($app in $requiredApps) {
        Assert-NonEmptyString $app.name "requiredApps.name"
        Assert-NonEmptyString $app.packageName "requiredApps.packageName"
        Assert-NonEmptyString $app.repair "requiredApps.repair"
        if (@("manual", "winget") -notcontains $app.repair) {
            throw "requiredApps.repair 不受支持: $($app.repair)"
        }
        if ($app.repair -eq "winget") {
            Assert-NonEmptyString $app.wingetId "requiredApps.wingetId"
            Assert-NonEmptyString $app.source "requiredApps.source"
        }
    }
    $duplicateRequiredApps = @($requiredApps |
        Group-Object { $_.packageName.ToLowerInvariant() } |
        Where-Object Count -gt 1)
    if ($duplicateRequiredApps.Count -gt 0) {
        throw "requiredApps.packageName 必须唯一"
    }

    Assert-UniqueStringList $policy.protectedApps "protectedApps"
    $protectedApps = @($policy.protectedApps)
    $requiredProtection = @(
        $requiredApps | ForEach-Object { $_.packageName }
    ) + @(
        "Microsoft.Edge",
        "XPFFTQ037JWMHS",
        "Microsoft.MicrosoftEdge.Stable",
        "Microsoft.SecHealthUI",
        "Microsoft.WindowsStore"
    )
    $missingProtection = @($requiredProtection | Where-Object { $protectedApps -notcontains $_ })
    if ($missingProtection.Count -gt 0) {
        throw "protectedApps 缺少必须保护项: $($missingProtection -join ', ')"
    }
}

function Get-Policy {
    if (-not (Test-Path -LiteralPath $PolicyPath)) {
        throw "策略文件不存在: $PolicyPath"
    }
    $policy = Get-Content -Raw -Encoding UTF8 -LiteralPath $PolicyPath | ConvertFrom-Json
    Test-Policy $policy
    return $policy
}

function Get-InstalledAppxNames {
    return @(Get-AppxPackage -ErrorAction Stop | Select-Object -ExpandProperty Name -Unique)
}

function Get-RequiredAppRows($policy) {
    $installed = Get-InstalledAppxNames
    return @($policy.requiredApps | ForEach-Object {
        [pscustomobject]@{
            Name = $_.name
            PackageName = $_.packageName
            State = if ($installed -contains $_.packageName) { "present" } else { "missing" }
            Repair = $_.repair
        }
    })
}

function Show-Audit($policy) {
    $windows = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion"
    $buildNumber = [int]$windows.CurrentBuild
    $productName = if ($buildNumber -ge 22000) {
        $windows.ProductName -replace "Windows 10", "Windows 11"
    } else {
        $windows.ProductName
    }
    Write-Host "Windows desired-state audit" -ForegroundColor Blue
    [pscustomobject]@{
        Product = $productName
        DisplayVersion = $windows.DisplayVersion
        Build = "$($windows.CurrentBuild).$($windows.UBR)"
        Win11Debloat = $policy.win11Debloat.version
        SafeDefaultAppRemoval = [bool]$policy.win11Debloat.useDefaultSafeAppRemoval
    } | Format-List

    Write-Host "Required built-in apps" -ForegroundColor Blue
    Get-RequiredAppRows $policy | Format-Table -AutoSize | Out-Host

    Write-Host "Planned Win11Debloat tweaks" -ForegroundColor Blue
    $policy.win11Debloat.tweaks | ForEach-Object { Write-Host "  - $_" }

    Write-Host "Protected packages" -ForegroundColor Blue
    $policy.protectedApps | ForEach-Object { Write-Host "  - $_" }
}

function Install-MissingRequiredApps($policy) {
    $winget = Get-Command winget -CommandType Application -ErrorAction SilentlyContinue
    $rows = Get-RequiredAppRows $policy
    foreach ($row in $rows | Where-Object State -eq "missing") {
        $app = $policy.requiredApps | Where-Object packageName -eq $row.PackageName | Select-Object -First 1
        if ($app.repair -ne "winget") {
            Write-Failure "$($app.name) 缺失，且不能由当前脚本安全自动恢复"
            continue
        }
        if (-not $winget) {
            Write-Failure "$($app.name) 缺失，但 winget 不可用"
            continue
        }

        $arguments = @(
            "install", "--id", $app.wingetId, "--exact", "--source", $app.source,
            "--accept-package-agreements", "--accept-source-agreements",
            "--disable-interactivity", "--silent"
        )
        Write-Status "恢复内置 App: $($app.name)"
        & $winget.Source @arguments
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            Write-Failure "$($app.name) 恢复失败，winget 退出码: $exitCode"
        }
    }

    $remaining = @(Get-RequiredAppRows $policy | Where-Object State -eq "missing")
    if ($remaining.Count -gt 0) {
        $names = $remaining | ForEach-Object Name
        throw "必须 App 仍缺失，已停止 Apply: $($names -join ', ')"
    }
    Write-Success "必须 App 状态检查通过"
}

function Get-Win11DebloatSource($policy) {
    $temporaryRoot = Join-Path $env:TEMP "carryon-win11debloat-$([Guid]::NewGuid())"
    $archivePath = "$temporaryRoot.zip"
    New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null

    try {
        Write-Status "下载固定版本 Win11Debloat $($policy.win11Debloat.version)"
        Invoke-WebRequest -Uri $policy.win11Debloat.downloadUrl -OutFile $archivePath -UseBasicParsing -TimeoutSec 600
        $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash.ToLowerInvariant()
        if ($actualHash -ne $policy.win11Debloat.sha256.ToLowerInvariant()) {
            throw "Win11Debloat SHA-256 不匹配。预期 $($policy.win11Debloat.sha256)，实际 $actualHash"
        }

        Expand-Archive -LiteralPath $archivePath -DestinationPath $temporaryRoot -Force
        $script = Get-ChildItem -LiteralPath $temporaryRoot -Filter "Win11Debloat.ps1" -Recurse | Select-Object -First 1
        if (-not $script) { throw "下载包中未找到 Win11Debloat.ps1" }

        return [pscustomobject]@{
            Root = $temporaryRoot
            Archive = $archivePath
            Script = $script.FullName
            PackageRoot = $script.DirectoryName
        }
    } catch {
        if (Test-Path -LiteralPath $archivePath) {
            Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path -LiteralPath $temporaryRoot) {
            Remove-Item -LiteralPath $temporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
        throw
    }
}

function Test-TweakParameters($source, $tweaks) {
    $tokens = $null
    $errors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile($source.Script, [ref]$tokens, [ref]$errors)
    if ($errors.Count -gt 0) { throw "Win11Debloat 脚本解析失败" }
    $parameters = @($ast.ParamBlock.Parameters | ForEach-Object { $_.Name.VariablePath.UserPath })
    foreach ($tweak in $tweaks) {
        if ($parameters -notcontains $tweak) {
            throw "策略中的 tweak 不受固定版本支持: $tweak"
        }
    }
}

function Test-ProtectedApps($policy, $source) {
    $appsPath = Join-Path $source.PackageRoot "Config\Apps.json"
    $appsConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $appsPath | ConvertFrom-Json
    $selectedIds = @($appsConfig.Apps |
        Where-Object SelectedByDefault |
        ForEach-Object { @($_.AppId) })
    $conflicts = @($policy.protectedApps | Where-Object { $selectedIds -contains $_ })
    if ($conflicts.Count -gt 0) {
        throw "上游默认删除集合包含保护 App: $($conflicts -join ', ')"
    }
}

function Invoke-Win11Debloat($policy, $source) {
    Test-TweakParameters $source $policy.win11Debloat.tweaks
    Test-ProtectedApps $policy $source

    $logRoot = Join-Path $env:ProgramData "carryon\windows-state"
    if (-not (Test-Path -LiteralPath $logRoot)) {
        New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
    }
    $logPath = Join-Path $logRoot "Win11Debloat-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

    $arguments = @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $source.Script,
        "-CLI", "-Silent", "-CreateRestorePoint", "-SkipExplorerRestart",
        "-LogPath", $logPath
    )
    if ($policy.win11Debloat.useDefaultSafeAppRemoval) {
        $arguments += "-RemoveApps"
    }
    foreach ($tweak in $policy.win11Debloat.tweaks) {
        $arguments += "-$tweak"
    }

    Write-Status "执行 Win11Debloat 固定策略"
    & powershell.exe @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Win11Debloat 退出码: $LASTEXITCODE"
    }
    Write-Success "Win11Debloat 执行完成，日志: $logPath"
}

function Get-WingetPackageState($winget, $id) {
    if (-not $winget) {
        return [pscustomobject]@{
            State = "unknown"
            Detail = "winget 不可用"
        }
    }

    $output = @(& $winget.Source list --id $id --exact --disable-interactivity 2>&1)
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        return [pscustomobject]@{ State = "present"; Detail = "" }
    }

    # APPINSTALLER_CLI_ERROR_NO_APPLICATIONS_FOUND is the only explicit absent result.
    if ($exitCode -eq -1978335212) {
        return [pscustomobject]@{ State = "absent"; Detail = "" }
    }

    $message = ($output | ForEach-Object { $_.ToString() }) -join " | "
    return [pscustomobject]@{
        State = "unknown"
        Detail = "winget 查询失败，退出码 $exitCode$(if ($message) { ": $message" })"
    }
}

function Get-DefaultRemovalState($source) {
    $appsPath = Join-Path $source.PackageRoot "Config\Apps.json"
    $appsConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $appsPath | ConvertFrom-Json
    $installed = Get-InstalledAppxNames
    $winget = Get-Command winget -CommandType Application -ErrorAction SilentlyContinue
    return @($appsConfig.Apps | Where-Object SelectedByDefault | ForEach-Object {
        $app = $_
        $ids = @($app.AppId)
        $state = "unknown"
        $detail = ""
        if ($app.RemovalMethod -eq "Appx") {
            $state = if ($ids | Where-Object { $installed -contains $_ }) { "present" } else { "absent" }
        } elseif ($app.RemovalMethod -eq "WinGet") {
            $idStates = @()
            foreach ($id in $ids) {
                $idStates += Get-WingetPackageState $winget $id
            }
            if ($idStates.State -contains "present") {
                $state = "present"
            } elseif ($idStates.State -contains "unknown") {
                $state = "unknown"
                $detail = ($idStates | Where-Object State -eq "unknown" | ForEach-Object Detail) -join " | "
            } else {
                $state = "absent"
            }
        } else {
            $detail = "不支持的删除方式: $($app.RemovalMethod)"
        }
        [pscustomobject]@{
            Name = $app.FriendlyName
            AppId = $ids -join ","
            Method = $app.RemovalMethod
            State = $state
            Detail = $detail
        }
    })
}

function Verify-State($policy, $source) {
    Test-TweakParameters $source $policy.win11Debloat.tweaks
    Test-ProtectedApps $policy $source
    $failed = $false
    $required = Get-RequiredAppRows $policy
    Write-Host "Required built-in apps" -ForegroundColor Blue
    $required | Format-Table -AutoSize | Out-Host
    if ($required.State -contains "missing") { $failed = $true }

    if ($policy.win11Debloat.useDefaultSafeAppRemoval) {
        $removal = Get-DefaultRemovalState $source
        $unresolved = @($removal | Where-Object State -ne "absent")
        Write-Host "Default safe-removal apps not converged" -ForegroundColor Blue
        if ($unresolved.Count -eq 0) {
            Write-Success "未发现仍存在的默认安全删除 App"
        } else {
            $unresolved | Format-Table -AutoSize | Out-Host
            $failed = $true
        }
    }

    if ($failed) {
        Write-Failure "Windows desired-state 验证未通过"
        return $false
    }
    Write-Success "Windows desired-state App 状态验证通过"
    return $true
}

$policy = Get-Policy

if ($Mode -eq "Audit") {
    Show-Audit $policy
    exit 0
}

if ($Mode -eq "Apply" -and -not (Test-Admin)) {
    Write-Failure "$Mode 模式请以管理员身份运行 PowerShell"
    exit 1
}

$source = $null
try {
    $source = Get-Win11DebloatSource $policy
    if ($Mode -eq "Apply") {
        Install-MissingRequiredApps $policy
        Invoke-Win11Debloat $policy $source
    }
    if (-not (Verify-State $policy $source)) { exit 1 }
} finally {
    if ($source) {
        if (Test-Path -LiteralPath $source.Archive) {
            Remove-Item -LiteralPath $source.Archive -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path -LiteralPath $source.Root) {
            Remove-Item -LiteralPath $source.Root -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
