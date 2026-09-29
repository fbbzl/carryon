# D 盘环境重装脚本
#
# 常用命令：
#   .\setup.ps1 -Mode Audit
#   .\setup.ps1 -Mode Restore -Tools current
#   .\setup.ps1 -Mode Restore -Tools all
#   .\setup.ps1 -Mode Restore -Tools @("java", "maven", "vscode")
#
# current：恢复当前机器的基线工具。
# optional：安装保留但当前未安装的 Tabby、Rancher Desktop。
# all：current + optional。

param(
    [string[]]$Tools = @("current"),
    [ValidateSet("Restore", "Audit")]
    [string]$Mode = "Restore",
    [switch]$SkipExisting,
    [switch]$ForceReinstall,
    [switch]$SkipSystemOptimization
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ErrorActionPreference = "Stop"
$failedTools = New-Object System.Collections.Generic.List[string]

if ($SkipExisting -and $ForceReinstall) {
    throw "-SkipExisting 与 -ForceReinstall 不能同时使用"
}

function Write-Status($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[OK] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARN] $message" -ForegroundColor Yellow }
function Write-Failure($message) { Write-Host "[ERROR] $message" -ForegroundColor Red }

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-CodexHome {
    if ($env:CODEX_HOME) { return $env:CODEX_HOME }
    return Join-Path $env:USERPROFILE ".codex"
}

function Set-EnvVar($name, $value, $scope = "User") {
    $current = [Environment]::GetEnvironmentVariable($name, $scope)
    if ($current -eq $value) {
        Write-Status "环境变量 $name 已正确设置"
        return
    }

    if ($current) {
        Write-Warning "环境变量 $name 当前值为 $current"
        if ((Read-Host "是否改为 $value ? (y/n)") -ne "y") { return }
    }

    [Environment]::SetEnvironmentVariable($name, $value, $scope)
    Write-Success "设置 $name = $value"
}

function Add-ToPath($newPaths, $scope = "User") {
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", $scope)
    $pathList = @($currentPath -split ";" | Where-Object { $_ })
    $added = @()

    foreach ($path in $newPaths) {
        $expanded = [Environment]::ExpandEnvironmentVariables($path)
        if ($pathList -contains $expanded -or $pathList -contains $path) {
            Write-Status "PATH 已包含 $path"
            continue
        }
        $added += $expanded
    }

    if ($added.Count -eq 0) { return }
    $newPath = (@($pathList) + $added) -join ";"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, $scope)
    Write-Success "追加 PATH: $($added -join '; ')"
}

function Copy-ConfigFile($source, $target) {
    if (-not (Test-Path -LiteralPath $source)) {
        Write-Warning "配置源不存在，跳过: $source"
        return
    }

    $targetDirectory = Split-Path -Parent $target
    if (-not (Test-Path -LiteralPath $targetDirectory)) {
        New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    }

    if (Test-Path -LiteralPath $target) {
        $backup = "$target.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item -LiteralPath $target -Destination $backup
        Write-Status "备份原配置: $backup"
    }

    Copy-Item -LiteralPath $source -Destination $target -Force
    Write-Success "复制配置: $target"
}

function Download-File($url, $output) {
    $attempts = 3
    for ($attempt = 1; $attempt -le $attempts; $attempt++) {
        try {
            Write-Status "下载 ($attempt/$attempts): $url"
            if (Test-Path -LiteralPath $output) {
                Remove-Item -LiteralPath $output -Force -ErrorAction SilentlyContinue
            }
            Invoke-WebRequest -Uri $url -OutFile $output -MaximumRedirection 10 -UseBasicParsing -TimeoutSec 1800
            Write-Success "下载完成: $output"
            return
        } catch {
            if ($attempt -eq $attempts) { throw }
            Write-Warning "下载失败，准备重试: $($_.Exception.Message)"
            Start-Sleep -Seconds 2
        }
    }
}

function Resolve-SogouDownloadUrl {
    $page = Invoke-WebRequest -Uri "https://pinyin.sogou.com/windows/" -UseBasicParsing -TimeoutSec 30
    $matches = [regex]::Matches($page.Content, 'https?://[^"''\s<>]+sogou_pinyin_[^"''\s<>]+\.exe[^"''\s<>]*')
    $url = $matches | ForEach-Object { $_.Value } | Where-Object { $_ -match "pinyinbanner" } | Select-Object -First 1
    if (-not $url) { throw "未能从搜狗输入法官方页面解析 Windows 安装包" }
    return $url
}

function Resolve-ADriveDownloadUrl {
    $page = Invoke-WebRequest -Uri "https://www.alipan.com/download" -UseBasicParsing -TimeoutSec 30
    $match = [regex]::Match($page.Content, 'https?://[^"''\s<>]+aDrive-[^"''\s<>]+\.exe')
    if (-not $match.Success) { throw "未能从阿里云盘官方页面解析 Windows 安装包" }
    return $match.Value
}

function Resolve-WeChatDownloadUrl {
    $page = Invoke-WebRequest -Uri "https://pc.weixin.qq.com/" -UseBasicParsing -TimeoutSec 30
    $match = [regex]::Match($page.Content, 'https?://[^"''\s<>]+/Universal/Windows/WeChatWin_[^"''\s<>]+\.exe')
    if (-not $match.Success) { throw "未能从微信官方页面解析 Windows 安装包" }
    return $match.Value
}

function Get-DownloadUrl($config) {
    switch ($config.urlResolver) {
        "sogou" { return Resolve-SogouDownloadUrl }
        "adrive" { return Resolve-ADriveDownloadUrl }
        "wechat" { return Resolve-WeChatDownloadUrl }
    }
    if ($config.adoptiumMajor) {
        return "https://api.adoptium.net/v3/binary/latest/$($config.adoptiumMajor)/ga/windows/x64/jdk/hotspot/normal/eclipse"
    }
    return $config.url
}

$currentTools = @(
    "git", "java8", "java11", "java17", "java21", "maven", "vscode",
    "jetbrains", "clash-verge", "cc-switch", "adrive", "sogou", "wechat"
)
$optionalTools = @("tabby", "rancher")

$toolConfig = [ordered]@{
    "git" = @{
        name = "Git"
        expectedVersion = "2.55.0.5"
        installDir = "D:\Git"
        installerType = "winget"
        wingetId = "Git.Git"
        wingetVersion = "2.55.0.5"
        verifyPath = "D:\Git\bin\git.exe"
        pathAdd = @("D:\Git\bin")
        envVar = @{ GIT_HOME = "D:\Git" }
    }
    "java8" = @{
        name = "JDK 8"
        expectedVersion = "最新 Temurin 8 更新版"
        installDir = "D:\Java\openjdk\java-se-8u44-ri"
        installerType = "zip"
        adoptiumMajor = "8"
        verifyPath = "D:\Java\openjdk\java-se-8u44-ri\bin\java.exe"
    }
    "java11" = @{
        name = "JDK 11"
        expectedVersion = "最新 Temurin 11 更新版"
        installDir = "D:\Java\openjdk\jdk-11.0.0.2"
        installerType = "zip"
        adoptiumMajor = "11"
        verifyPath = "D:\Java\openjdk\jdk-11.0.0.2\bin\java.exe"
    }
    "java17" = @{
        name = "JDK 17"
        expectedVersion = "最新 Temurin 17 更新版"
        installDir = "D:\Java\openjdk\jdk-17.0.0.1"
        installerType = "zip"
        adoptiumMajor = "17"
        verifyPath = "D:\Java\openjdk\jdk-17.0.0.1\bin\java.exe"
    }
    "java21" = @{
        name = "JDK 21"
        expectedVersion = "最新 Temurin 21 更新版"
        installDir = "D:\Java\openjdk\jdk-21"
        installerType = "zip"
        adoptiumMajor = "21"
        verifyPath = "D:\Java\openjdk\jdk-21\bin\java.exe"
        envVar = @{ JAVA_HOME = "D:\Java\openjdk\jdk-21" }
        pathAdd = @("D:\Java\openjdk\jdk-21\bin")
    }
    "maven" = @{
        name = "Apache Maven"
        expectedVersion = "3.9.16"
        installDir = "D:\Maven\apache-maven-3.9.16"
        installerType = "zip"
        url = "https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip"
        verifyPath = "D:\Maven\apache-maven-3.9.16\bin\mvn.cmd"
        envVar = @{ M2_HOME = "D:\Maven\apache-maven-3.9.16"; MAVEN_HOME = "D:\Maven\apache-maven-3.9.16" }
        pathAdd = @("D:\Maven\apache-maven-3.9.16\bin")
        configFiles = @(
            @{ source = "$scriptDir\maven\settings.xml"; target = "D:\Maven\settings.xml" },
            @{ source = "$scriptDir\maven\settings.xml"; target = "$env:USERPROFILE\.m2\settings.xml" }
        )
    }
    "vscode" = @{
        name = "VS Code"
        expectedVersion = "1.139.1"
        installDir = "D:\Microsoft VS Code"
        installerType = "exe"
        url = "https://update.code.visualstudio.com/1.139.1/win32-x64/stable"
        silentArgs = @("/VERYSILENT", "/NORESTART", "/MERGETASKS=!runcode", '/DIR="D:\Microsoft VS Code"')
        verifyPath = "D:\Microsoft VS Code\bin\code.cmd"
        pathAdd = @("D:\Microsoft VS Code\bin")
        configFiles = @(
            @{ source = "$scriptDir\vscode\settings.json"; target = "$env:APPDATA\Code\User\settings.json" }
        )
    }
    "jetbrains" = @{
        name = "IntelliJ IDEA Ultimate"
        expectedVersion = "2026.2.3"
        installDir = "D:\JetBrains\IntelliJ IDEA 2026.2.3"
        installerType = "exe"
        url = "https://download.jetbrains.com/idea/ideaIU-2026.2.3.exe"
        silentArgs = @("/S", "/D=D:\JetBrains\IntelliJ IDEA 2026.2.3")
        verifyPath = "D:\JetBrains\IntelliJ IDEA 2026.2.3\bin\idea64.exe"
        configFiles = @(
            @{ source = "$scriptDir\jetbrains\idea64.exe.vmoptions"; target = "D:\JetBrains\IntelliJ IDEA 2026.2.3\bin\idea64.exe.vmoptions" },
            @{ source = "$scriptDir\jetbrains\idea.properties"; target = "D:\JetBrains\IntelliJ IDEA 2026.2.3\bin\idea.properties" }
        )
    }
    "clash-verge" = @{
        name = "Clash Verge"
        expectedVersion = "2.5.6"
        installDir = "D:\Clash Verge"
        installerType = "winget"
        wingetId = "ClashVergeRev.ClashVergeRev"
        wingetVersion = "2.5.6"
        verifyPath = "D:\Clash Verge\clash-verge.exe"
    }
    "cc-switch" = @{
        name = "CC Switch"
        expectedVersion = "3.20.4"
        installDir = "D:\CC Switch"
        installerType = "winget"
        wingetId = "farion1231.CC-Switch"
        wingetVersion = "3.20.4"
        verifyPath = "D:\CC Switch\cc-switch.exe"
    }
    "adrive" = @{
        name = "阿里云盘"
        expectedVersion = "官方当前 Windows 版"
        installDir = "D:\aDrive"
        installerType = "exe"
        urlResolver = "adrive"
        silentArgs = @("/S", "/D=D:\aDrive")
        verifyPath = "D:\aDrive\aDrive.exe"
    }
    "sogou" = @{
        name = "搜狗输入法"
        expectedVersion = "官方当前 Windows 版"
        installDir = "D:\SogouInput"
        installerType = "exe"
        urlResolver = "sogou"
        interactive = $true
        verifyPath = "D:\SogouInput\SogouExe\SogouExe.exe"
    }
    "wechat" = @{
        name = "微信"
        expectedVersion = "官方当前 Windows 版"
        installDir = "D:\Tencent\Wechat\Weixin"
        installerType = "exe"
        urlResolver = "wechat"
        interactive = $true
        verifyPath = "D:\Tencent\Wechat\Weixin\Weixin.exe"
    }
    "tabby" = @{
        name = "Tabby"
        expectedVersion = "winget 当前稳定版"
        installDir = "D:\Tabby"
        installerType = "winget"
        wingetId = "Eugeny.Tabby"
        verifyPath = "D:\Tabby\Tabby.exe"
        optional = $true
    }
    "rancher" = @{
        name = "Rancher Desktop"
        expectedVersion = "winget 当前稳定版"
        installDir = "D:\Rancher"
        installerType = "winget"
        wingetId = "SUSE.RancherDesktop"
        verifyPath = "D:\Rancher\Rancher Desktop.exe"
        optional = $true
    }
}

function Resolve-ToolKeys($requestedTools) {
    $resolved = New-Object System.Collections.Generic.List[string]
    foreach ($tool in $requestedTools) {
        switch ($tool.ToLowerInvariant()) {
            "current" { foreach ($item in $currentTools) { $resolved.Add($item) } }
            "optional" { foreach ($item in $optionalTools) { $resolved.Add($item) } }
            "all" { foreach ($item in ($currentTools + $optionalTools)) { $resolved.Add($item) } }
            "java" { foreach ($item in @("java8", "java11", "java17", "java21")) { $resolved.Add($item) } }
            default {
                if (-not $toolConfig.Contains($tool)) { throw "未知工具: $tool" }
                $resolved.Add($tool)
            }
        }
    }
    return @($resolved | Select-Object -Unique)
}

function Show-Audit($toolKeys) {
    $rows = foreach ($key in $toolKeys) {
        $config = $toolConfig[$key]
        [pscustomobject]@{
            Key = $key
            Tool = $config.name
            Version = $config.expectedVersion
            Target = $config.installDir
            State = if (Test-Path -LiteralPath $config.verifyPath) { "present" } else { "missing" }
            Group = if ($config.optional) { "optional" } else { "current" }
        }
    }
    $rows | Format-Table -AutoSize
}

function Confirm-Reinstall($config) {
    if (-not (Test-Path -LiteralPath $config.installDir)) { return $true }
    if ($ForceReinstall) {
        Write-Status "$($config.name) 按 -ForceReinstall 重新安装"
        return $true
    }
    if ($SkipExisting) {
        Write-Status "$($config.name) 目录已存在，按 -SkipExisting 跳过"
        return $false
    }
    Write-Warning "$($config.name) 目标目录已存在: $($config.installDir)"
    return (Read-Host "是否重新下载安装? (y/n)") -eq "y"
}

function Install-WingetTool($config) {
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) { throw "未找到 winget，请先通过 Microsoft App Installer 安装 winget" }

    $arguments = @(
        "install", "--id", $config.wingetId, "--exact", "--source", "winget",
        "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity",
        "--silent", "--force", "--location", $config.installDir
    )
    if ($config.wingetVersion) { $arguments += @("--version", $config.wingetVersion) }

    Write-Status "winget 安装: $($config.wingetId)"
    & $winget.Source @arguments
    if ($LASTEXITCODE -ne 0) { throw "winget 退出码: $LASTEXITCODE" }
}

function Install-ExecutableTool($config) {
    $downloadUrl = Get-DownloadUrl $config
    $temporaryFile = Join-Path $env:TEMP "$([Guid]::NewGuid()).exe"
    try {
        Download-File $downloadUrl $temporaryFile
        if ($config.interactive) {
            Write-Warning "$($config.name) 使用交互式安装，请将安装目录设置为 $($config.installDir)"
            $process = Start-Process -FilePath $temporaryFile -Wait -PassThru
        } else {
            $process = Start-Process -FilePath $temporaryFile -ArgumentList $config.silentArgs -Wait -PassThru
        }
        if ($process.ExitCode -ne 0) {
            throw "安装器退出码: $($process.ExitCode)"
        }
    } finally {
        if (Test-Path -LiteralPath $temporaryFile) {
            Remove-Item -LiteralPath $temporaryFile -Force -ErrorAction SilentlyContinue
        }
    }
}

function Install-ZipTool($config) {
    $downloadUrl = Get-DownloadUrl $config
    $temporaryFile = Join-Path $env:TEMP "$([Guid]::NewGuid()).zip"
    $parent = Split-Path -Parent $config.installDir
    $staging = Join-Path $parent ".init-staging-$([Guid]::NewGuid())"
    $backup = $null

    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    try {
        Download-File $downloadUrl $temporaryFile
        Expand-Archive -LiteralPath $temporaryFile -DestinationPath $staging -Force

        $items = @(Get-ChildItem -LiteralPath $staging -Force)
        $sourceRoot = $staging
        if ($items.Count -eq 1 -and $items[0].PSIsContainer) { $sourceRoot = $items[0].FullName }

        $relativeVerifyPath = $config.verifyPath.Substring($config.installDir.Length).TrimStart("\")
        $stagedVerifyPath = Join-Path $sourceRoot $relativeVerifyPath
        if (-not (Test-Path -LiteralPath $stagedVerifyPath)) {
            throw "解压结果缺少验证文件: $stagedVerifyPath"
        }

        if (Test-Path -LiteralPath $config.installDir) {
            $backup = "$($config.installDir).backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
            Move-Item -LiteralPath $config.installDir -Destination $backup
            Write-Status "保留原目录备份: $backup"
        }

        Move-Item -LiteralPath $sourceRoot -Destination $config.installDir
        Write-Success "解压到: $($config.installDir)"
    } catch {
        if ($backup -and -not (Test-Path -LiteralPath $config.installDir) -and (Test-Path -LiteralPath $backup)) {
            Move-Item -LiteralPath $backup -Destination $config.installDir
            Write-Warning "安装失败，已恢复原目录"
        }
        throw
    } finally {
        if (Test-Path -LiteralPath $temporaryFile) {
            Remove-Item -LiteralPath $temporaryFile -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path -LiteralPath $staging) {
            Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

function Apply-ToolConfiguration($config) {
    if ($config.configFiles) {
        foreach ($file in $config.configFiles) {
            Copy-ConfigFile $file.source $file.target
        }
    }
    if ($config.envVar) {
        foreach ($entry in $config.envVar.GetEnumerator()) {
            Set-EnvVar $entry.Key $entry.Value
        }
    }
    if ($config.pathAdd) { Add-ToPath $config.pathAdd }
}

function Install-Tool($key) {
    $config = $toolConfig[$key]
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "处理: $($config.name)" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue

    if (-not (Confirm-Reinstall $config)) { return }

    try {
        switch ($config.installerType) {
            "winget" { Install-WingetTool $config }
            "exe" { Install-ExecutableTool $config }
            "zip" { Install-ZipTool $config }
            default { throw "不支持的安装器类型: $($config.installerType)" }
        }

        if (-not (Test-Path -LiteralPath $config.verifyPath)) {
            throw "未在预期路径发现验证文件: $($config.verifyPath)"
        }
        Apply-ToolConfiguration $config
        Write-Success "$($config.name) 验证通过: $($config.verifyPath)"
    } catch {
        $failedTools.Add($key)
        Write-Failure "$($config.name) 安装失败: $($_.Exception.Message)"
        Write-Warning "已跳过该工具，继续处理后续项目"
    }
}

function Install-SystemOptimizationSkill {
    $source = Join-Path $scriptDir "windows-system-optimization"
    $sourceSkill = Join-Path $source "SKILL.md"
    if (-not (Test-Path -LiteralPath $sourceSkill)) {
        Write-Warning "未找到系统优化 skill: $sourceSkill"
        return $false
    }

    $skillsRoot = Join-Path (Get-CodexHome) "skills"
    $target = Join-Path $skillsRoot "windows-system-optimization"
    if (-not (Test-Path -LiteralPath $skillsRoot)) {
        New-Item -ItemType Directory -Path $skillsRoot -Force | Out-Null
    }
    if (Test-Path -LiteralPath $target) {
        if (-not $ForceReinstall -and (Read-Host "系统优化 skill 已存在，是否更新? (y/n)") -ne "y") {
            return (Test-Path -LiteralPath (Join-Path $target "SKILL.md"))
        }
    } else {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
    }

    Copy-Item -Path (Join-Path $source "*") -Destination $target -Recurse -Force
    Write-Success "安装系统优化 skill: $target"
    return $true
}

function Start-SystemOptimization {
    if ($SkipSystemOptimization) {
        Write-Status "已跳过 Windows 系统优化"
        return
    }
    if ($failedTools.Count -gt 0) {
        Write-Warning "以下工具安装失败，暂不启动系统优化: $($failedTools -join ', ')"
        Write-Warning "处理失败项后重新运行，或使用 -SkipSystemOptimization 明确跳过系统优化。"
        return
    }
    if (-not (Install-SystemOptimizationSkill)) { return }

    $codex = Get-Command codex -ErrorAction SilentlyContinue
    $prompt = '使用 $windows-system-optimization 执行重装后的 Windows 系统优化。init/setup.ps1 已重新下载安装 D 盘工具，请先只读盘点并逐项征求确认。'
    if (-not $codex) {
        Write-Warning "未检测到 Codex CLI"
        Write-Host "稍后安装并登录 Codex 后，使用上述 prompt 启动系统优化。" -ForegroundColor Cyan
        return
    }

    Write-Status "启动 Windows 系统优化；系统改动将在会话中逐项确认"
    & $codex.Source -C $scriptDir $prompt
    if ($LASTEXITCODE -ne 0) { Write-Warning "Codex 退出码: $LASTEXITCODE" }
}

$toolKeys = Resolve-ToolKeys $Tools

if ($Mode -eq "Audit") {
    Write-Host "D 盘恢复清单（只读）" -ForegroundColor Blue
    Show-Audit $toolKeys
    exit 0
}

if (-not (Test-Admin)) {
    Write-Failure "Restore 模式请以管理员身份运行 PowerShell"
    exit 1
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "D 盘环境重新下载安装" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Show-Audit $toolKeys

foreach ($key in $toolKeys) { Install-Tool $key }

if ($toolKeys -contains "maven" -and -not (Test-Path -LiteralPath "D:\Maven\repository")) {
    New-Item -ItemType Directory -Path "D:\Maven\repository" -Force | Out-Null
    Write-Success "创建 Maven 本地仓库: D:\Maven\repository"
}

Start-SystemOptimization

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "初始化流程结束，请检查上方失败项并重启终端。" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
