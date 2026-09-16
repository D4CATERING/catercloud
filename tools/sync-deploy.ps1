$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$deploy = Join-Path $root "deploy"

if (-not (Test-Path $deploy)) {
    throw "No existe la carpeta deploy."
}

$files = @(
    "index.html",
    "login.html"
)

foreach ($file in $files) {
    Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $deploy $file) -Force
}

$directories = @(
    "assets",
    "css",
    "js",
    "sql",
    "vendor"
)

foreach ($dir in $directories) {
    $source = Join-Path $root $dir
    $target = Join-Path $deploy $dir
    if (-not (Test-Path $source)) {
        continue
    }
    if (-not (Test-Path $target)) {
        New-Item -ItemType Directory -Path $target | Out-Null
    }
    Copy-Item -Path (Join-Path $source "*") -Destination $target -Recurse -Force
}

Write-Host "OK: deploy sincronizado desde archivos fuente."
