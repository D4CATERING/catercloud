$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$patterns = @(
    "\.from\(['""]orders['""]\)",
    "from\(['""]orders['""]\)"
)

$violations = @()
$jsRoots = @(
    (Join-Path $root "js"),
    (Join-Path $root "deploy\js")
) | Where-Object { Test-Path $_ }

$jsRoots |
    ForEach-Object { Get-ChildItem -Path $_ -File -Filter "*.js" } |
    Where-Object { $_.Name -ne "storage.js" } |
    ForEach-Object {
        $relative = $_.FullName.Substring($root.Length + 1)
        $lineNumber = 0
        Get-Content $_.FullName | ForEach-Object {
            $lineNumber += 1
            $line = $_
            foreach ($pattern in $patterns) {
                if ($line -match $pattern) {
                    $violations += [PSCustomObject]@{
                        File = $relative
                        Line = $lineNumber
                        Pattern = $pattern
                        Text = $line.Trim()
                    }
                }
            }
        }
    }

if ($violations.Count -gt 0) {
    $violations | Format-Table -AutoSize
    throw "Se detectaron accesos directos a Supabase orders fuera de js/storage.js."
}

Write-Host "OK: Supabase orders solo se consulta desde js/storage.js."
