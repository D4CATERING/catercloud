$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$patterns = @(
    "localStorage\.(getItem|setItem|removeItem)\(['""]historialComandas['""]",
    "localStorage\.(getItem|setItem|removeItem)\(['""]historialComandasLogistica['""]"
)

$violations = @()

Get-ChildItem -Path (Join-Path $root "js") -File -Filter "*.js" |
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
    throw "Se detectaron accesos directos a historiales fuera de js/storage.js."
}

Write-Host "OK: los historiales locales solo se referencian desde js/storage.js."
