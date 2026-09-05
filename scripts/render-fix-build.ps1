# Met a jour la buildCommand Render (fix devDependencies pour tsc)
param(
    [string]$EnvFile = ".env.deploy",
    [string]$ServiceName = "medicare-tchad-api",
    [switch]$Redeploy
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Get-Content (Join-Path $root $EnvFile) | ForEach-Object {
    if ($_ -match '^RENDER_API_KEY=(.+)$') { $env:RENDER_API_KEY = $matches[1].Trim() }
}

$buildCommand = "npm ci --include=dev && npx prisma generate && npm run build && npx prisma migrate deploy"
$headers = @{
    Authorization = "Bearer $env:RENDER_API_KEY"
    Accept        = "application/json"
    "Content-Type" = "application/json"
}

$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=100" -Headers $headers
$service = $services | ForEach-Object { $_.service } | Where-Object { $_.name -eq $ServiceName } | Select-Object -First 1
if (-not $service) { throw "Service $ServiceName introuvable" }

$body = @{
    serviceDetails = @{
        envSpecificDetails = @{
            buildCommand = $buildCommand
        }
    }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method PATCH -Uri "https://api.render.com/v1/services/$($service.id)" -Headers $headers -Body $body | Out-Null
Write-Host "[OK] buildCommand mise a jour sur $($service.name)"

if ($Redeploy) {
    Invoke-RestMethod -Method POST -Uri "https://api.render.com/v1/services/$($service.id)/deploys" -Headers $headers -Body "{}" | Out-Null
    Write-Host "[OK] Redeploiement declenche"
}
