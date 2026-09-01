# D 盘开发环境一键初始化脚本
# 用法：以管理员身份运行 PowerShell，然后执行：
#   cd D:\workspace\carryon\init
#   .\setup.ps1
# 或指定要安装的工具：
#   .\setup.ps1 -Tools @("git", "java", "maven", "vscode")
# 跳过已安装的工具：
#   .\setup.ps1 -SkipExisting

param(
    [string[]]$Tools = @("all"),
    [switch]$SkipExisting
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ErrorActionPreference = "Stop"

# 辅助函数
function Write-Status($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warning($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Set-EnvVar($name, $value, $scope = 'User') {
    $current = [Environment]::GetEnvironmentVariable($name, $scope)
    if ($current -eq $value) {
        Write-Status "环境变量 $name 已设置，跳过"
        return
    }
    if ($current -and $current -ne $value) {
        Write-Warning "环境变量 $name 当前值: $current, 新值: $value"
        $confirm = Read-Host "是否覆盖? (y/n)"
        if ($confirm -ne 'y') { return }
    }
    [Environment]::SetEnvironmentVariable($name, $value, $scope)
    Write-Success "设置 $name = $value"
}

function Add-ToPath($newPaths, $scope = 'User') {
    $currentPath = [Environment]::GetEnvironmentVariable('PATH', $scope)
    $pathList = $currentPath -split ';'
    $added = @()
    foreach ($p in $newPaths) {
        $resolved = [Environment]::ExpandEnvironmentVariables($p)
        if ($pathList -contains $resolved -or $pathList -contains $p) {
            Write-Status "PATH 已包含 $p，跳过"
            continue
        }
        $added += $resolved
        Write-Success "追加 PATH: $p"
    }
    if ($added.Count -gt 0) {
        $newPath = ($currentPath.TrimEnd(';') + ';' + ($added -join ';'))
        [Environment]::SetEnvironmentVariable('PATH', $newPath, $scope)
        Write-Success "更新 PATH 完成"
    }
}

function Get-DownloadUrl($config) {
    # 如果已有固定 URL（如 VS Code /latest），直接使用
    if ($config.url) {
        return $config.url
    }

    # GitHub Releases 动态获取最新版本
    if ($config.githubRepo) {
        try {
            $apiUrl = "https://api.github.com/repos/$($config.githubRepo)/releases/latest"
            Write-Status "查询最新版本: $apiUrl"
            $release = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 15
            # 检查是否返回错误消息（如 API 速率限制）
            if ($release.PSObject.Properties['message']) {
                throw "API error: $($release.message)"
            }
            # 查找匹配的 asset
            $asset = $release.assets | Where-Object { $_.name -match $config.assetPattern } | Select-Object -First 1
            if ($asset) {
                Write-Success "最新版本: $($release.tag_name) ($($asset.name))"
                return $asset.browser_download_url
            }
            throw "未找到匹配的下载文件"
        } catch {
            Write-Warning "无法获取最新版本: $($_.Exception.Message)"
            Write-Warning "使用回退版本: $($config.urlFallback)"
            return $config.urlFallback
        }
    }

    # Maven 动态获取最新版本
    if ($config.mavenMetadata) {
        try {
            Write-Status "查询最新 Maven 版本: $($config.mavenMetadata)"
            $metadata = [xml](Invoke-RestMethod -Uri $config.mavenMetadata -TimeoutSec 15)
            $latest = $metadata.metadata.versioning.latest
            $url = "https://dlcdn.apache.org/maven/maven-3/$latest/binaries/apache-maven-$latest-bin.zip"
            Write-Success "最新 Maven 版本: $latest"
            return $url
        } catch {
            Write-Warning "无法获取最新 Maven 版本: $($_.Exception.Message)"
            Write-Warning "使用回退版本: $($config.urlFallback)"
            return $config.urlFallback
        }
    }

    return $config.urlFallback
}

function Download-File($url, $output) {
    Write-Status "下载: $url"
    Invoke-WebRequest -Uri $url -OutFile $output -MaximumRedirection 10 -UseBasicParsing
    Write-Success "下载完成: $output"
}

function Find-InstalledDir($pattern) {
    $parent = Split-Path -Parent $pattern
    if (-not (Test-Path $parent)) { return $null }
    $dirs = Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like (Split-Path -Leaf $pattern) }
    if ($dirs.Count -gt 0) { return $dirs[0].FullName }
    return $null
}

# 工具配置表
# 小工具：脚本自动下载安装（动态获取最新版本）
# 大工具：只记录下载地址，检测已安装后复制配置
$toolConfig = @{
    "git" = @{
        name = "Git"
        # 动态获取最新版本
        githubRepo = "git-for-windows/git"
        assetPattern = "Git-.*-64-bit\.exe"
        urlFallback = "https://github.com/git-for-windows/git/releases/download/v2.48.1.windows.1/Git-2.48.1-64-bit.exe"
        # 安装配置
        installDir = "D:\Git"
        installerType = "exe"
        silentArgs = "/VERYSILENT /NORESTART /DIR=""D:\Git"""
        envVar = @{ GIT_HOME = "D:\Git" }
        pathAdd = @("%GIT_HOME%\bin")
        configFile = @{
            source = "$scriptDir\git\.gitconfig"
            target = "$env:USERPROFILE\.gitconfig"
        }
        verify = { git --version }
    }
    "java" = @{
        name = "Java JDK 21"
        # 动态获取最新版本
        githubRepo = "adoptium/temurin21-binaries"
        assetPattern = "OpenJDK21U-jdk_x64_windows_hotspot_.*\.zip"
        urlFallback = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_windows_hotspot_21.0.5_11.zip"
        # 安装配置
        installDir = "D:\Java\openjdk\jdk-21"
        installerType = "zip"
        envVar = @{ JAVA_HOME = "D:\Java\openjdk\jdk-21" }
        pathAdd = @("%JAVA_HOME%\bin")
        verify = { java -version }
    }
    "maven" = @{
        name = "Apache Maven"
        # 动态获取最新版本
        mavenMetadata = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/maven-metadata.xml"
        urlFallback = "https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip"
        # 安装配置
        installDir = "D:\maven\apache-maven-3.9.16"
        installerType = "zip"
        envVar = @{ M2_HOME = "D:\maven\apache-maven-3.9.16"; MAVEN_HOME = "D:\maven\apache-maven-3.9.16" }
        pathAdd = @("%M2_HOME%\bin")
        configFile = @{
            source = "$scriptDir\maven\settings.xml"
            target = "D:\maven\settings.xml"
        }
        verify = { mvn -v }
    }
    "vscode" = @{
        name = "VS Code"
        # 固定 URL（自动重定向到最新版）
        url = "https://update.code.visualstudio.com/latest/win32-x64/system"
        installDir = "D:\Microsoft VS Code"
        installerType = "exe"
        silentArgs = "/VERYSILENT /NORESTART /MERGETASKS=!runcode /DIR=""D:\Microsoft VS Code"""
        configFile = @{
            source = "$scriptDir\vscode\settings.json"
            target = "$env:APPDATA\Code\User\settings.json"
        }
        pathAdd = @("D:\Microsoft VS Code\bin")
        verify = { & "D:\Microsoft VS Code\bin\code.cmd" --version }
    }
    "jetbrains" = @{
        name = "IntelliJ IDEA"
        # 大安装包，不自动下载，只记录下载地址
        downloadPage = "https://www.jetbrains.com/idea/download/"
        downloadUrlUltimate = "https://download.jetbrains.com/idea/ideaIU-<version>.exe"
        downloadUrlCommunity = "https://download.jetbrains.com/idea/ideaIC-<version>.exe"
        largePackage = $true
        installDir = "D:\JetBrains\IntelliJ IDEA <version>"
        configFile = @{
            source1 = "$scriptDir\jetbrains\idea64.exe.vmoptions"
            source2 = "$scriptDir\jetbrains\idea.properties"
        }
        verify = { Test-Path "D:\JetBrains\IntelliJ IDEA *\bin\idea64.exe" }
    }
    "dbeaver" = @{
        name = "DBeaver"
        # 固定 URL（自动重定向到最新版）
        url = "https://dbeaver.io/files/dbeaver-ce-latest-win32.win32.x86_64.zip"
        installDir = "D:\DBeaver"
        installerType = "zip"
        configFile = @{
            source = "$scriptDir\dbeaver\dbeaver.ini"
            target = "D:\DBeaver\dbeaver.ini"
        }
        verify = { Test-Path "D:\DBeaver\dbeaver.exe" }
    }
    "tabby" = @{
        name = "Tabby"
        # 动态获取最新版本
        githubRepo = "Eugeny/tabby"
        assetPattern = "tabby-.*-setup-x64\.exe"
        urlFallback = "https://github.com/Eugeny/tabby/releases/download/v1.0.223/tabby-1.0.223-setup-x64.exe"
        installDir = "D:\Tabby"
        installerType = "exe"
        silentArgs = "/VERYSILENT /NORESTART /DIR=""D:\Tabby"""
        verify = { Test-Path "D:\Tabby\Tabby.exe" }
    }
    "rancher" = @{
        name = "Rancher Desktop"
        # 动态获取最新版本
        githubRepo = "rancher-sandbox/rancher-desktop"
        assetPattern = "Rancher\.Desktop\.Setup\..*\.msi"
        urlFallback = "https://github.com/rancher-sandbox/rancher-desktop/releases/download/v1.22.3/Rancher.Desktop.Setup.1.22.3.msi"
        installDir = "D:\Rancher"
        installerType = "msi"
        silentArgs = "/qn /norestart INSTALLDIR=""D:\Rancher"""
        verify = { Test-Path "D:\Rancher\Rancher Desktop.exe" }
    }
    "cc-switch" = @{
        name = "CC Switch"
        # 固定 URL（文件名固定，latest 重定向）
        url = "https://github.com/farion1231/cc-switch/releases/latest/download/cc-switch.exe"
        installDir = "D:\CC Switch"
        installerType = "exe"
        silentArgs = "/VERYSILENT /NORESTART /DIR=""D:\CC Switch"""
        verify = { Test-Path "D:\CC Switch\cc-switch.exe" }
    }
}

function Install-Tool($toolKey) {
    $config = $toolConfig[$toolKey]
    if (-not $config) {
        Write-Error "未知工具: $toolKey"
        return
    }

    Write-Host "`n========================================" -ForegroundColor Blue
    Write-Host "处理: $($config.name)" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue

    # 大安装包工具：检测已安装，只复制配置
    if ($config.largePackage) {
        $detectedDir = Find-InstalledDir $config.installDir
        if ($detectedDir) {
            Write-Success "检测到 $($config.name) 已安装: $detectedDir"
            # 复制配置文件
            foreach ($key in $config.configFile.Keys) {
                $src = $config.configFile[$key]
                $dst = $src -replace "$scriptDir\jetbrains", "$detectedDir\bin"
                if (Test-Path $src) {
                    $dstDir = Split-Path -Parent $dst
                    if (-not (Test-Path $dstDir)) {
                        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
                    }
                    Copy-Item -Path $src -Destination $dst -Force
                    Write-Success "复制配置: $dst"
                }
            }
            return
        } else {
            Write-Warning "$($config.name) 未安装，安装包较大（约 800MB），请手动下载并安装"
            Write-Host "  下载页: $($config.downloadPage)" -ForegroundColor Cyan
            if ($config.downloadUrlUltimate) { Write-Host "  Ultimate 版: $($config.downloadUrlUltimate)" -ForegroundColor Cyan }
            if ($config.downloadUrlCommunity) { Write-Host "  Community 版: $($config.downloadUrlCommunity)" -ForegroundColor Cyan }
            Write-Host "  安装后重新运行脚本，将自动复制配置。" -ForegroundColor Cyan
            return
        }
    }

    # 小工具：正常下载安装流程
    if (Test-Path $config.installDir) {
        if ($SkipExisting) {
            Write-Status "$($config.installDir) 已存在，跳过"
            return
        }
        Write-Warning "$($config.installDir) 已存在"
        $confirm = Read-Host "是否覆盖? (y/n/skip)"
        if ($confirm -eq 'skip') { return }
        if ($confirm -ne 'y') { return }
        Remove-Item -Path $config.installDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    # 创建父目录
    $parent = Split-Path -Parent $config.installDir
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    # 获取最新版本下载 URL
    $downloadUrl = Get-DownloadUrl $config

    # 下载
    $tmpFile = "$env:TEMP\$toolKey-$([Guid]::NewGuid().ToString()).tmp"
    try {
        Download-File $downloadUrl $tmpFile
    } catch {
        Write-Error "下载失败: $downloadUrl - $($_.Exception.Message)"
        Write-Warning "跳过 $($config.name)，继续下一个工具"
        return
    }

    try {
        # 安装
        switch ($config.installerType) {
            'exe' {
                $args = $config.silentArgs
                Write-Status "运行安装程序: $tmpFile $args"
                Start-Process -FilePath $tmpFile -ArgumentList $args -Wait
            }
            'msi' {
                $args = "/i `"$tmpFile`" $($config.silentArgs)"
                Write-Status "运行 MSI: msiexec $args"
                Start-Process -FilePath "msiexec" -ArgumentList $args -Wait
            }
            'zip' {
                Write-Status "解压到: $(Split-Path -Parent $config.installDir)"
                $extractParent = Split-Path -Parent $config.installDir
                Expand-Archive -Path $tmpFile -DestinationPath $extractParent -Force
                # 查找解压出来的文件夹（通常只有一个）
                $extractedItems = Get-ChildItem -Path $extractParent -Directory | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-1) }
                if ($extractedItems.Count -eq 1) {
                    $extractedDir = $extractedItems[0].FullName
                    if ($extractedDir -ne $config.installDir) {
                        Write-Status "重命名: $($extractedItems[0].Name) -> $(Split-Path -Leaf $config.installDir)"
                        Rename-Item -Path $extractedDir -NewName (Split-Path -Leaf $config.installDir) -Force
                    }
                } else {
                    Write-Warning "无法确定解压后的文件夹，请手动检查"
                }
            }
        }

        # 复制配置文件
        if ($config.configFile) {
            $src = $config.configFile.source
            $dst = $config.configFile.target
            if (Test-Path $src) {
                $dstDir = Split-Path -Parent $dst
                if (-not (Test-Path $dstDir)) {
                    New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
                }
                Copy-Item -Path $src -Destination $dst -Force
                Write-Success "复制配置: $dst"
            }
        }

        # 设置环境变量
        if ($config.envVar) {
            foreach ($kv in $config.envVar.GetEnumerator()) {
                Set-EnvVar $kv.Key $kv.Value
            }
        }

        # 追加 PATH
        if ($config.pathAdd) {
            Add-ToPath $config.pathAdd
        }

        # 验证
        Write-Status "验证安装..."
        try {
            & $config.verify
            Write-Success "$($config.name) 验证通过"
        } catch {
            Write-Warning "验证命令失败，请手动检查"
        }

    } finally {
        if (Test-Path $tmpFile) {
            Remove-Item -Path $tmpFile -Force -ErrorAction SilentlyContinue
        }
    }
}

# 主逻辑
if (-not (Test-Admin)) {
    Write-Error "请以管理员身份运行 PowerShell"
    exit 1
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "D 盘开发环境一键初始化脚本" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "自动获取最新版本，支持失败跳过..." -ForegroundColor Cyan
Write-Host ""

$toolsToInstall = if ($Tools -contains "all") {
    $toolConfig.Keys | Sort-Object
} else {
    $Tools
}

foreach ($tool in $toolsToInstall) {
    Install-Tool $tool
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "初始化完成！请重启终端使环境变量生效。" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# 创建仓库目录（如果 Maven 安装了）
if ($Tools -contains "all" -or $Tools -contains "maven") {
    if (-not (Test-Path "D:\maven\repository")) {
        New-Item -ItemType Directory -Path "D:\maven\repository" -Force | Out-Null
        Write-Success "创建 Maven 本地仓库: D:\maven\repository"
    }
}
