# Affiche le statut et les logs du dernier deploy Render (sans secrets)
param(
    [string]$EnvFile = ".env.deploy",
    [string]$ServiceName = "medicare-tchad-api"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$path = Join-Path $root $EnvFile
if (-not (Test-Path $path)) { throw "Fichier $EnvFile introuvable" }

Get-Content $path | ForEach-Object {
    if ($_ -match '^RENDER_API_KEY=(.+)$') { $env:RENDER_API_KEY = $matches[1].Trim() }
}

$headers = @{
    Authorization = "Bearer $env:RENDER_API_KEY"
    Accept        = "application/json"
}

$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers
$service = $services | ForEach-Object { $_.service } | Where-Object { $_.name -eq $ServiceName } | Select-Object -First 1
if (-not $service) { throw "Service $ServiceName introuvable" }

$owners = Invoke-RestMethod -Uri "https://api.render.com/v1/owners?limit=5" -Headers $headers
$ownerId = ($owners | ForEach-Object { $_.owner } | Select-Object -First 1).id

Write-Host "Service: $($service.name) ($($service.id))"
Write-Host "URL: $($service.serviceDetails.url)"

$deploys = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$($service.id)/deploys?limit=3" -Headers $headers
foreach ($item in $deploys) {
    $d = $item.deploy
    Write-Host ""
    Write-Host "Deploy $($d.id) - status: $($d.status) - created: $($d.createdAt)"
}

$latest = $deploys[0].deploy
Write-Host "Latest deploy status: $($latest.status)"

try {
    $logUrl = "https://api.render.com/v1/logs?ownerId=$ownerId&resource=$($service.id)&type=build&direction=backward&limit=100"
    $logResp = Invoke-RestMethod -Uri $logUrl -Headers $headers
    Write-Host ""
    Write-Host "=== Logs build (API) ==="
    if ($logResp.logs) {
        $logResp.logs | ForEach-Object { Write-Host $_.message }
    } else {
        $logResp | ConvertTo-Json -Depth 6 | Write-Host
    }
} catch {
    Write-Host "Logs API: $($_.Exception.Message)"
    try {
        $events = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$($service.id)/events?limit=20" -Headers $headers
        Write-Host ""
        Write-Host "=== Events recents ==="
        $events | ForEach-Object {
            $e = $_.event
            Write-Host "$($e.timestamp) $($e.type) $($e.details.message)"
        }
    } catch {
        Write-Host "Events API: $($_.Exception.Message)"
    }
}
