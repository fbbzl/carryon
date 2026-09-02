param(
    [string]$SkillsRoot = $PSScriptRoot
)

$errors = [System.Collections.Generic.List[string]]::new()
$skillFiles = Get-ChildItem -LiteralPath $SkillsRoot -Recurse -File -Filter SKILL.md

if ($skillFiles.Count -eq 0) {
    throw "No SKILL.md files found in $SkillsRoot"
}

foreach ($skillFile in $skillFiles) {
    $content = Get-Content -Raw -Encoding UTF8 $skillFile.FullName
    $prefix = $skillFile.FullName

    if ($content -notmatch '(?s)^---\r?\n(?<frontmatter>.*?)\r?\n---\r?\n') {
        $errors.Add("${prefix}: missing YAML front matter")
        continue
    }

    $frontmatter = $Matches.frontmatter
    $name = [regex]::Match($frontmatter, '(?m)^name:\s*(?<value>[a-z0-9]+(?:-[a-z0-9]+)*)\s*$').Groups['value'].Value
    $description = [regex]::Match($frontmatter, '(?m)^description:\s*.+$').Success
    $version = [regex]::Match($frontmatter, '(?m)^\s+version:\s*\d+\.\d+\.\d+\s*$').Success
    $author = [regex]::Match($frontmatter, '(?m)^\s+author:\s*carryon\s*$').Success

    if ($name -ne $skillFile.Directory.Name) { $errors.Add("${prefix}: name must match directory") }
    if (-not $description) { $errors.Add("${prefix}: missing description") }
    if (-not $version) { $errors.Add("${prefix}: invalid semantic version") }
    if (-not $author) { $errors.Add("${prefix}: author must be carryon") }
    if ($content -notmatch 'Mermaid' -or $content -notmatch 'ASCII') { $errors.Add("${prefix}: missing portable diagram guidance") }

    foreach ($target in [regex]::Matches($content, '\]\((?<path>\.\.?/[^)]+)\)')) {
        $resolved = Join-Path $skillFile.Directory.FullName $target.Groups['path'].Value
        if (-not (Test-Path -LiteralPath $resolved)) { $errors.Add("${prefix}: broken link $($target.Groups['path'].Value)") }
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Validated $($skillFiles.Count) skills."
