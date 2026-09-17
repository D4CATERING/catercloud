$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Count-Matches {
    param(
        [string]$Text,
        [string]$Pattern
    )
    return ([regex]::Matches($Text, $Pattern)).Count
}

Write-Host "== JavaScript =="
Get-ChildItem -Path (Join-Path $root "js") -File -Filter "*.js" |
    ForEach-Object {
        $text = Get-Content $_.FullName -Raw
        [PSCustomObject]@{
            File = $_.Name
            Lines = ($text -split "`n").Count
            WindowRefs = Count-Matches $text "\bwindow\."
            InlineHandlers = Count-Matches $text "\bon(click|change|input|focus|blur|keydown|pointerdown|mousedown)="
            InnerHTML = Count-Matches $text "innerHTML\s*="
            LocalStorage = Count-Matches $text "localStorage"
            SupabaseCalls = Count-Matches $text "supabaseClient"
        }
    } |
    Sort-Object Lines -Descending |
    Format-Table -AutoSize

Write-Host ""
Write-Host "== CSS =="
Get-ChildItem -Path (Join-Path $root "css") -File -Filter "*.css" |
    ForEach-Object {
        $text = Get-Content $_.FullName -Raw
        [PSCustomObject]@{
            File = $_.Name
            Lines = ($text -split "`n").Count
        }
    } |
    Sort-Object Lines -Descending |
    Format-Table -AutoSize

Write-Host ""
Write-Host "== SQL =="
Get-ChildItem -Path (Join-Path $root "sql") -File -Filter "*.sql" |
    ForEach-Object {
        $text = Get-Content $_.FullName -Raw
        [PSCustomObject]@{
            File = $_.Name
            Lines = ($text -split "`n").Count
        }
    } |
    Sort-Object Lines -Descending |
    Select-Object -First 20 |
    Format-Table -AutoSize

Write-Host ""
Write-Host "OK: auditoria local completada."
