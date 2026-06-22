$ErrorActionPreference = "Stop"

$badChars = @(
    [char]0x00C3, # A-tilde mojibake marker
    [char]0x00C2, # A-circumflex mojibake marker
    [char]0x00E2, # â mojibake marker
    [char]0x00F0, # ð mojibake marker
    [char]0xFFFD  # replacement character
)
$pattern = ($badChars | ForEach-Object { [regex]::Escape([string]$_) }) -join "|"
$files = Get-ChildItem -Path . -Include *.js,*.html,*.css,*.sql -Recurse |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\|\\deploy\\|\\backups\\|\\outputs\\|\\vendor\\"
    }

$hits = @()
foreach ($file in $files) {
    $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $lines = $text -split "`r?`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pattern) {
            $hits += "$($file.FullName):$($i + 1): $($lines[$i].Trim())"
        }
    }
}

if ($hits.Count) {
    $hits
    exit 1
}

"OK: no se detectaron caracteres mojibake."
