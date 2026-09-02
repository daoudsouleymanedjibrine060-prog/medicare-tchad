# Deploiement cloud MediCare Tchad - Aiven + Render + Vercel
# Usage:
#   1. Copier .env.deploy.example -> .env.deploy et remplir les secrets
#   2. .\scripts\deploy-cloud.ps1
param(
    [switch]$SkipSeed,
    [switch]$SkipVercel,
    [string]$EnvFile = ".env.deploy"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Load-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return @{} }
    $vars = @{}
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $idx = $line.IndexOf("=")
        if ($idx -lt 1) { return }
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
        $vars[$key] = $val
        Set-Item -Path "env:$key" -Value $val
    }
    return $vars
}

function Require-Var {
    param([string]$Name)
    $val = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($val)) {
        throw "Variable manquante : $Name (definir dans $EnvFile ou l'environnement)"
    }
    return $val
}

function Invoke-RenderApi {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body = $null
    )
    $headers = @{
        Authorization = "Bearer $env:RENDER_API_KEY"
        Accept        = "application/json"
    }
    $uri = "https://api.render.com/v1$Path"
    if ($null -ne $Body) {
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
    }
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

function Wait-RenderDeploy {
    param(
        [string]$ServiceId,
        [int]$TimeoutSec = 900
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    Write-Host "Attente deploiement Render $ServiceId..." -ForegroundColor Cyan
    while ((Get-Date) -lt $deadline) {
        $deploys = Invoke-RenderApi -Method GET -Path "/services/$ServiceId/deploys?limit=1"
        $deploy = $deploys[0].deploy
        $status = $deploy.status
        Write-Host "  Deploy: $status"
        if ($status -eq "live") { return $deploy }
        if ($status -in @("build_failed", "update_failed", "canceled", "deactivated")) {
            throw "Deploiement Render echoue : $status"
        }
        Start-Sleep -Seconds 15
    }
    throw "Timeout deploiement Render"
}

Write-Host "=== MediCare Tchad - Deploiement cloud ===" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $root $EnvFile
$hasEnvFile = Test-Path $envPath
$hasEnvVars = -not [string]::IsNullOrWhiteSpace($env:DATABASE_URL) -and `
    -not [string]::IsNullOrWhiteSpace($env:RENDER_API_KEY) -and `
    -not [string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)

if ($hasEnvFile) {
    Load-DotEnv -Path $envPath | Out-Null
} elseif (-not $hasEnvVars) {
    Write-Host "Fichier $EnvFile introuvable et variables d'environnement absentes." -ForegroundColor Yellow
    Write-Host "Copiez .env.deploy.example -> .env.deploy et renseignez DATABASE_URL, RENDER_API_KEY, VERCEL_TOKEN"
    Write-Host ""
    Write-Host "MySQL Aiven :"
    Write-Host "  1. console.aiven.io -> Create service -> MySQL"
    Write-Host "  2. CREATE DATABASE medicare_tchad;"
    Write-Host '  3. DATABASE_URL=mysql://USER:PASS@HOST:PORT/medicare_tchad?ssl-mode=REQUIRED'
    exit 1
}

$databaseUrl = Require-Var -Name "DATABASE_URL"
$null = Require-Var -Name "RENDER_API_KEY"
$frontendUrl = if ($env:FRONTEND_URL) { $env:FRONTEND_URL.TrimEnd("/") } else { "https://medicare-tchad.vercel.app" }
$renderServiceName = if ($env:RENDER_SERVICE_NAME) { $env:RENDER_SERVICE_NAME } else { "medicare-tchad-api" }
$vercelProject = if ($env:VERCEL_PROJECT_NAME) { $env:VERCEL_PROJECT_NAME } else { "medicare-tchad" }

Write-Host "[1/6] Test connexion MySQL + migrate..." -ForegroundColor Cyan
Push-Location (Join-Path $root "backend")
try {
    $env:DATABASE_URL = $databaseUrl
    npm ci 2>&1 | Out-Null
    npx prisma generate
    npx prisma migrate deploy
    Write-Host "[OK] Migrations appliquees" -ForegroundColor Green
} finally {
    Pop-Location
}

if (-not $SkipSeed) {
    Write-Host "[2/6] Seed base prod..." -ForegroundColor Cyan
    Push-Location (Join-Path $root "backend")
    try {
        $env:DATABASE_URL = $databaseUrl
        npm run db:seed
        Write-Host "[OK] Seed termine" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[2/6] Seed ignore" -ForegroundColor Yellow
}

Write-Host "[3/6] Render API - recherche service $renderServiceName..." -ForegroundColor Cyan
try {
    $services = Invoke-RenderApi -Method GET -Path "/services?limit=100"
} catch {
    throw "Render API inaccessible. Verifiez RENDER_API_KEY dans .env.deploy. Detail: $($_.Exception.Message)"
}

$service = $services | ForEach-Object { $_.service } | Where-Object { $_.name -eq $renderServiceName } | Select-Object -First 1

if (-not $service) {
    Write-Host "[ACTION REQUISE] Service Render introuvable." -ForegroundColor Yellow
    Write-Host "  1. https://dashboard.render.com/blueprints -> New Blueprint Instance"
    Write-Host "  2. Repo medicare-tchad, branche main"
    Write-Host "  3. DATABASE_URL + FRONTEND_URL=$frontendUrl"
    Write-Host "  4. Relancez ce script apres statut Live"
    exit 2
}

$serviceId = $service.id
$renderHost = ($service.serviceDetails.url -replace "^https?://", "").TrimEnd("/")
Write-Host "  Service ID: $serviceId"
Write-Host "  URL: https://$renderHost"

Write-Host "[4/6] Mise a jour env Render..." -ForegroundColor Cyan
$envVars = Invoke-RenderApi -Method GET -Path "/services/$serviceId/env-vars"
$existing = @{}
foreach ($item in $envVars) { $existing[$item.envVar.key] = $item.envVar }

function Set-RenderEnvVar {
    param([string]$Key, [string]$Value)
    if ($existing.ContainsKey($Key)) {
        Invoke-RenderApi -Method PUT -Path "/services/$serviceId/env-vars/$Key" -Body @{ value = $Value } | Out-Null
    } else {
        Invoke-RenderApi -Method POST -Path "/services/$serviceId/env-vars" -Body @{ key = $Key; value = $Value } | Out-Null
    }
}

Set-RenderEnvVar -Key "DATABASE_URL" -Value $databaseUrl
Set-RenderEnvVar -Key "FRONTEND_URL" -Value $frontendUrl
Write-Host "[OK] Variables Render mises a jour" -ForegroundColor Green

Write-Host "  Declenchement redeploiement Render..."
Invoke-RenderApi -Method POST -Path "/services/$serviceId/deploys" -Body @{} | Out-Null
Wait-RenderDeploy -ServiceId $serviceId | Out-Null

Write-Host "  Test health Render..."
$health = Invoke-RestMethod -Uri "https://$renderHost/api/v1/health" -TimeoutSec 120
if ($health.status -ne "ok") { throw "Health Render inattendu" }
Write-Host "[OK] API Render live" -ForegroundColor Green

if (-not $SkipVercel) {
    $vercelToken = Require-Var -Name "VERCEL_TOKEN"
    Write-Host "[5/6] Deploiement Vercel..." -ForegroundColor Cyan

    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "  Installation vercel CLI..."
        npm install -g vercel
    }

    $env:VERCEL_TOKEN = $vercelToken

    if (-not (Test-Path ".vercel/project.json")) {
        vercel link --yes --token $vercelToken --project $vercelProject 2>&1
    }

    $existingVercelEnv = vercel env ls production --token $vercelToken 2>&1 | Out-String
    if ($existingVercelEnv -notmatch "VITE_API_URL") {
        "/api/v1" | vercel env add VITE_API_URL production --token $vercelToken --yes 2>&1
    }

    vercel deploy --prod --yes --token $vercelToken
    Write-Host "[OK] Vercel deploy termine" -ForegroundColor Green
} else {
    Write-Host "[5/6] Vercel ignore" -ForegroundColor Yellow
}

Write-Host "[6/6] Verification finale..." -ForegroundColor Cyan
$vercelDomain = ($frontendUrl -replace "^https?://", "").TrimEnd("/")
& (Join-Path $PSScriptRoot "deploy-vercel-render.ps1") -VercelDomain $vercelDomain -RenderHost $renderHost

Write-Host ""
Write-Host "Deploiement termine." -ForegroundColor Green
Write-Host "  Frontend : $frontendUrl"
Write-Host "  API      : https://$renderHost/api/v1/health"
