#requires -Version 7.0
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$WorkUnitId,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$VisualizationDirectory,

    [string]$TemplatePath = (Join-Path $PSScriptRoot 'sc-task-view.html')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ScTaskViewId {
    param([Parameter(Mandatory)][string]$Id)

    if ($Id -match '^[A-Za-z0-9_-]{1,80}$') {
        return "sc-task-view--$Id"
    }

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Id)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $digest = $sha256.ComputeHash($bytes)
    }
    finally {
        $sha256.Dispose()
    }

    $hex = [System.Convert]::ToHexString($digest).ToLowerInvariant()
    return "sc-task-view--sha256-$hex"
}

function Test-PathInsideDirectory {
    param(
        [Parameter(Mandatory)][string]$DirectoryPath,
        [Parameter(Mandatory)][string]$CandidatePath
    )

    $separator = [System.IO.Path]::DirectorySeparatorChar
    $rootPrefix = $DirectoryPath.TrimEnd([char[]]'\/') + $separator
    return $CandidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)
}

function Assert-NoReparseAncestors {
    param([Parameter(Mandatory)][System.IO.DirectoryInfo]$Directory)

    $current = $Directory
    while ($null -ne $current) {
        if (($current.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "VisualizationDirectory or an existing ancestor is a reparse point: $($current.FullName)"
        }
        $current = $current.Parent
    }
}

if (-not (Test-Path -LiteralPath $VisualizationDirectory -PathType Container)) {
    throw "VisualizationDirectory does not exist or is not a directory: $VisualizationDirectory"
}

if (-not (Test-Path -LiteralPath $TemplatePath -PathType Leaf)) {
    throw "TemplatePath does not exist or is not a file: $TemplatePath"
}

$rootItem = Get-Item -LiteralPath $VisualizationDirectory
$templateItem = Get-Item -LiteralPath $TemplatePath
Assert-NoReparseAncestors -Directory $rootItem
$rootPath = [System.IO.Path]::GetFullPath($rootItem.FullName)
$viewId = Get-ScTaskViewId -Id $WorkUnitId
$candidatePath = [System.IO.Path]::GetFullPath((Join-Path $rootPath "$viewId.html"))

if (-not (Test-PathInsideDirectory -DirectoryPath $rootPath -CandidatePath $candidatePath)) {
    throw "Candidate output path escapes VisualizationDirectory: $candidatePath"
}

$exists = Test-Path -LiteralPath $candidatePath
if ($exists) {
    $candidateItem = Get-Item -LiteralPath $candidatePath
    if ($candidateItem.PSIsContainer) {
        throw "Candidate output path is a directory: $candidatePath"
    }
    if (($candidateItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw "Candidate output path is a reparse point and will not be written: $candidatePath"
    }
}

$action = if ($exists) { 'update' } else { 'create' }
$written = $false
if ($PSCmdlet.ShouldProcess($candidatePath, "$action SC task-view artifact")) {
    $content = [System.IO.File]::ReadAllText($templateItem.FullName, [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText($candidatePath, $content, [System.Text.UTF8Encoding]::new($false))
    $written = $true
}

[pscustomobject]@{
    view_id = $viewId
    path = $candidatePath
    action = $action
    written = $written
}
