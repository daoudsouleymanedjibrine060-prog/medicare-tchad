# Demarre MediCare Tchad en local (Windows) : Docker + compose + health + verify-api
# Usage: powershell -ExecutionPolicy Bypass -File scripts\start-dev.ps1
param(
    [int]$DockerWaitSeconds = 120,
    [int]$HealthWaitSeconds = 90
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Test-DockerReady {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    docker info 2>$null | Out-Null
    $ok = $LASTEXITCODE -eq 0
    $ErrorActionPreference = $prev
    return $ok
}

function Start-DockerDesktop {
    $paths = @(
        "C:\Program Files\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) {
            Write-Host "Demarrage de Docker Desktop..." -ForegroundColor Cyan
            Start-Process $p
            return $true
        }
    }
    return $false
}

Write-Host "=== MediCare Tchad - demarrage local ===" -ForegroundColor Cyan
Write-Host "Dossier : $root"
Write-Host ""

if (-not (Test-Path (Join-Path $root "docker-compose.yml"))) {
    Write-Host "Erreur : docker-compose.yml introuvable. Lancez ce script depuis la racine medicare-tchad." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Erreur : Docker CLI non installe. Installez Docker Desktop." -ForegroundColor Red
    exit 1
}

if (-not (Test-DockerReady)) {
    if (-not (Start-DockerDesktop)) {
        Write-Host "Erreur : Docker Desktop introuvable. Installez-le puis relancez." -ForegroundColor Red
        exit 1
    }
    $deadline = (Get-Date).AddSeconds($DockerWaitSeconds)
    $attempt = 0
    while ((Get-Date) -lt $deadline) {
        $attempt++
        if (Test-DockerReady) {
            Write-Host "Docker pret (apres $attempt tentative(s))." -ForegroundColor Green
            break
        }
        Write-Host "Attente Docker... ($attempt)"
        Start-Sleep -Seconds 5
    }
    if (-not (Test-DockerReady)) {
        Write-Host "Timeout : Docker Desktop ne repond pas. Ouvrez-le manuellement puis relancez." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Docker deja actif." -ForegroundColor Green
}

Write-Host ""
Write-Host "Lancement docker compose up -d ..." -ForegroundColor Cyan
$prevEa = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker compose up -d 2>&1 | Out-Host
$composeExit = $LASTEXITCODE
$ErrorActionPreference = $prevEa
if ($composeExit -ne 0) {
    Write-Host "Echec docker compose up -d (code $LASTEXITCODE)" -ForegroundColor Red
    exit $composeExit
}

Write-Host ""
Write-Host "Attente API health (http://localhost:4000/api/v1/health) ..." -ForegroundColor Cyan
$healthOk = $false
$healthDeadline = (Get-Date).AddSeconds($HealthWaitSeconds)
while ((Get-Date) -lt $healthDeadline) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:4000/api/v1/health" -TimeoutSec 5
        if ($health.status -eq "ok") {
            Write-Host "API OK : $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
            $healthOk = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 3
    }
}

if (-not $healthOk) {
    Write-Host "Timeout : API ne repond pas. Logs : docker logs medicare-api --tail 40" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verification verify-api ..." -ForegroundColor Cyan
npm run verify:api
$verifyExit = $LASTEXITCODE

Write-Host ""
try {
    $fe = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 10
    Write-Host "Frontend : http://localhost:5173 (HTTP $($fe.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "Frontend : http://localhost:5173 - en attente ou erreur ($($_.Exception.Message))" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Acces ===" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:5173"
Write-Host "  API      : http://localhost:4000/api/v1/health"
Write-Host "  Patient  : patient@medicare-td.test / Patient@123"
Write-Host ""

if ($verifyExit -ne 0) {
    Write-Host "verify-api : des tests ont echoue (code $verifyExit)" -ForegroundColor Red
    exit $verifyExit
}

Write-Host "Tout est pret." -ForegroundColor Green
exit 0
