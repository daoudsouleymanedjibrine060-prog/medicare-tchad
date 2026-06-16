# Déploiement production MediCare Tchad — Windows PowerShell
# Usage: .\scripts\deploy-prod.ps1 [-Seed]
param([switch]$Seed)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "ERREUR: Editez .env puis relancez ce script." -ForegroundColor Red
    exit 1
}

Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*NGINX_CONFIG=(.+)$') {
        $env:NGINX_CONFIG = $matches[1].Trim()
    }
}
if (-not $env:NGINX_CONFIG) {
    if ((Test-Path "nginx\ssl\fullchain.pem") -and (Test-Path "nginx\ssl\privkey.pem")) {
        $env:NGINX_CONFIG = "nginx.conf"
    } else {
        $env:NGINX_CONFIG = "nginx.bootstrap.conf"
        Write-Host "Mode HTTP bootstrap (pas de certificats SSL)" -ForegroundColor Yellow
    }
}

Write-Host "=== Deploiement MediCare Tchad ===" -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml up -d --build

Write-Host "Attente demarrage API (30s)..."
Start-Sleep -Seconds 30

$status = docker inspect -f '{{.State.Status}}' medicare-api-prod 2>$null
if ($status -ne "running") {
    Write-Host "ERREUR: API non demarree. Logs:" -ForegroundColor Red
    docker logs medicare-api-prod --tail 30
    exit 1
}

if ($Seed) {
    Write-Host "Execution du seed..."
    docker exec medicare-api-prod npx tsx prisma/seed.ts
}

try {
    $health = Invoke-RestMethod -Uri "http://localhost/api/v1/health" -TimeoutSec 10
    Write-Host "Health check OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "Health check echoue: $_" -ForegroundColor Red
    docker logs medicare-api-prod --tail 20
    exit 1
}

Write-Host ""
Write-Host "Site: http://localhost" -ForegroundColor Green
Write-Host "Verification: node scripts/verify-api.js http://localhost/api/v1"
