param(
    [switch]$SkipEncoding
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$nodeCandidates = @(
    (Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"),
    "node"
)

$node = $null
foreach ($candidate in $nodeCandidates) {
    try {
        $cmd = Get-Command $candidate -ErrorAction Stop
        $node = $cmd.Source
        break
    } catch {
        continue
    }
}

if (-not $node) {
    throw "No se encontro Node.js para validar JavaScript."
}

Write-Host "Validando JavaScript con $node"
$jsRoots = @(
    (Join-Path $root "js"),
    (Join-Path $root "deploy\js")
) | Where-Object { Test-Path $_ }

$jsFiles = $jsRoots |
    ForEach-Object { Get-ChildItem -Path $_ -Filter "*.js" -File } |
    Sort-Object FullName

foreach ($file in $jsFiles) {
    & $node --check $file.FullName
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo la validacion JS: $($file.FullName)"
    }
}

if (-not $SkipEncoding) {
    $encodingScript = Join-Path $PSScriptRoot "check-encoding.ps1"
    if (Test-Path $encodingScript) {
        & powershell -ExecutionPolicy Bypass -File $encodingScript
        if ($LASTEXITCODE -ne 0) {
            throw "Fallo la validacion de codificacion."
        }
    }
}

$storageBoundariesScript = Join-Path $PSScriptRoot "check-storage-boundaries.ps1"
if (Test-Path $storageBoundariesScript) {
    & powershell -ExecutionPolicy Bypass -File $storageBoundariesScript
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo la validacion de limites de storage."
    }
}

$supabaseBoundariesScript = Join-Path $PSScriptRoot "check-supabase-boundaries.ps1"
if (Test-Path $supabaseBoundariesScript) {
    & powershell -ExecutionPolicy Bypass -File $supabaseBoundariesScript
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo la validacion de limites de Supabase."
    }
}

Write-Host "OK: validacion del proyecto completada."
