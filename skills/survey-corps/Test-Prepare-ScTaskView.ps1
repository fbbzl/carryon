#requires -Version 7.0
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$helper = Join-Path $PSScriptRoot 'Prepare-ScTaskView.ps1'
$template = Join-Path $PSScriptRoot 'sc-task-view.html'

function Assert-Condition {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

$safe = & $helper -WorkUnitId 'sc-task-view-v1' -VisualizationDirectory $PSScriptRoot -TemplatePath $template -WhatIf
Assert-Condition ($safe.view_id -eq 'sc-task-view--sc-task-view-v1') 'Safe work_unit_id did not map directly.'
Assert-Condition (-not $safe.written) 'WhatIf must not write an artifact.'

$unsafe = & $helper -WorkUnitId '../outside\任务' -VisualizationDirectory $PSScriptRoot -TemplatePath $template -WhatIf
Assert-Condition ($unsafe.view_id -match '^sc-task-view--sha256-[a-f0-9]{64}$') 'Unsafe work_unit_id did not map to a SHA-256 view_id.'
Assert-Condition ($unsafe.path.StartsWith($PSScriptRoot, [System.StringComparison]::OrdinalIgnoreCase)) 'Candidate path is outside the visualization directory.'

$missingDirectory = Join-Path $PSScriptRoot 'does-not-exist-for-sc-task-view'
$missingTemplate = Join-Path $PSScriptRoot 'does-not-exist-template.html'
foreach ($case in @(
    @{ Directory = $missingDirectory; Template = $template; Name = 'Missing visualization directory' },
    @{ Directory = $PSScriptRoot; Template = $missingTemplate; Name = 'Missing template' }
)) {
    $failed = $false
    try {
        & $helper -WorkUnitId 'sc-task-view-v1' -VisualizationDirectory $case.Directory -TemplatePath $case.Template -WhatIf | Out-Null
    }
    catch {
        $failed = $true
    }
    Assert-Condition $failed "$($case.Name) was accepted."
}

$helperSource = Get-Content -Raw -Encoding utf8 $helper
Assert-Condition ($helperSource -match '\$candidateItem\.PSIsContainer') 'Candidate directory protection is missing.'
Assert-Condition ($helperSource -match 'Assert-NoReparseAncestors') 'Ancestor reparse-point protection is missing.'

Write-Output 'Prepare-ScTaskView validation passed without writing artifacts.'
