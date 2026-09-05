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
    param(
        [string]$Name,
        [hashtable]$LoadedVars = @{}
    )
    $val = (Get-Item -Path "env:$Name" -ErrorAction SilentlyContinue).Value
    if ([string]::IsNullOrWhiteSpace($val)) {
        if ($LoadedVars.ContainsKey($Name)) {
            throw "Variable vide : $Name est presente dans $EnvFile mais sans valeur. Renseignez-la puis relancez."
        }
        throw "Variable manquante : $Name (definir dans $EnvFile ou l'environnement)"
    }
    return $val
}

function Test-RequiredEnvVars {
    param(
        [Parameter(Mandatory = $true)][string[]]$Names,
        [hashtable]$LoadedVars = @{}
    )
    $problems = @()
    foreach ($name in $Names) {
        $val = (Get-Item -Path "env:$name" -ErrorAction SilentlyContinue).Value
        if ([string]::IsNullOrWhiteSpace($val)) {
            $problems += "$name : vide"
            continue
        }
        if ($name -eq "DATABASE_URL" -and $val -notmatch '^mysql://') {
            $problems += "DATABASE_URL : doit commencer par mysql://"
        }
        if ($name -eq "RENDER_API_KEY" -and $val -notmatch '^rnd_') {
            $problems += "RENDER_API_KEY : doit commencer par rnd_"
        }
        if ($name -eq "VERCEL_TOKEN" -and $val.Length -lt 20) {
            $problems += "VERCEL_TOKEN : trop court"
        }
    }
    if ($problems.Count -eq 0) { return }

    Write-Host "Erreur : secrets cloud invalides dans $EnvFile" -ForegroundColor Red
    $problems | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "Relancez : powershell -ExecutionPolicy Bypass -File scripts\init-env-deploy.ps1"
    Write-Host 'Exemple DATABASE_URL=mysql://USER:PASS@HOST:PORT/medicare_tchad?ssl-mode=REQUIRED'
    exit 1
}

function Invoke-Npm {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$ArgumentList
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $FilePath @ArgumentList
        if ($LASTEXITCODE -ne 0) {
            throw "$FilePath $($ArgumentList -join ' ') a echoue (code $LASTEXITCODE)"
        }
    } finally {
        $ErrorActionPreference = $prev
    }
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

function Get-RenderOwnerId {
    $owners = Invoke-RenderApi -Method GET -Path "/owners?limit=20"
    $owner = $owners | ForEach-Object { $_.owner } | Select-Object -First 1
    if (-not $owner -or [string]::IsNullOrWhiteSpace($owner.id)) {
        throw "Aucun workspace Render trouve pour cette cle API"
    }
    Write-Host "  Workspace Render: $($owner.name) ($($owner.id))"
    return $owner.id
}

function Get-GitHubRepoUrl {
    param([string]$RootPath)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        $remote = git -C $RootPath remote get-url origin 2>$null
        if ([string]::IsNullOrWhiteSpace($remote)) { return $null }
        $remote = $remote.Trim()
        if ($remote -match '^git@github\.com:(.+)\.git$') {
            return "https://github.com/$($matches[1])"
        }
        if ($remote -match '^https://github\.com/(.+?)(?:\.git)?$') {
            return "https://github.com/$($matches[1])"
        }
        return $remote -replace '\.git$', ''
    } finally {
        $ErrorActionPreference = $prev
    }
}

function New-RenderWebService {
    param(
        [string]$Name,
        [string]$OwnerId,
        [string]$RepoUrl,
        [string]$DatabaseUrl,
        [string]$FrontendUrl
    )
    $body = @{
        type       = "web_service"
        name       = $Name
        ownerId    = $OwnerId
        repo       = $RepoUrl
        branch     = "main"
        rootDir    = "backend"
        autoDeploy = "yes"
        envVars    = @(
            @{ key = "NODE_ENV"; value = "production" }
            @{ key = "SMS_ENABLED"; value = "false" }
            @{ key = "DATABASE_URL"; value = $DatabaseUrl }
            @{ key = "FRONTEND_URL"; value = $FrontendUrl }
            @{ key = "JWT_SECRET"; generateValue = $true }
            @{ key = "JWT_REFRESH_SECRET"; generateValue = $true }
        )
        serviceDetails = @{
            runtime            = "node"
            plan               = "free"
            region             = "frankfurt"
            healthCheckPath    = "/api/v1/health"
            envSpecificDetails = @{
                buildCommand = "npm ci --include=dev && npx prisma generate && npm run build && npx prisma migrate deploy"
                startCommand = "node dist/index.js"
            }
        }
    }
    Write-Host "  Creation service Render via API..."
    $created = Invoke-RenderApi -Method POST -Path "/services" -Body $body
    return $created.service
}

Write-Host "=== MediCare Tchad - Deploiement cloud ===" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $root $EnvFile
$hasEnvFile = Test-Path $envPath
$loadedVars = @{}

if ($hasEnvFile) {
    $loadedVars = Load-DotEnv -Path $envPath
} elseif (-not (
    -not [string]::IsNullOrWhiteSpace($env:DATABASE_URL) -and
    -not [string]::IsNullOrWhiteSpace($env:RENDER_API_KEY) -and
    -not [string]::IsNullOrWhiteSpace($env:VERCEL_TOKEN)
)) {
    Write-Host "Fichier $EnvFile introuvable et variables d'environnement absentes." -ForegroundColor Yellow
    Write-Host "Copiez .env.deploy.example -> .env.deploy et renseignez DATABASE_URL, RENDER_API_KEY, VERCEL_TOKEN"
    Write-Host ""
    Write-Host "MySQL Aiven :"
    Write-Host "  1. console.aiven.io -> Create service -> MySQL"
    Write-Host "  2. CREATE DATABASE medicare_tchad;"
    Write-Host '  3. DATABASE_URL=mysql://USER:PASS@HOST:PORT/medicare_tchad?ssl-mode=REQUIRED'
    exit 1
}

$requiredNames = @("DATABASE_URL", "RENDER_API_KEY")
if (-not $SkipVercel) { $requiredNames += "VERCEL_TOKEN" }
Test-RequiredEnvVars -Names $requiredNames -LoadedVars $loadedVars

$databaseUrl = Require-Var -Name "DATABASE_URL" -LoadedVars $loadedVars
$null = Require-Var -Name "RENDER_API_KEY" -LoadedVars $loadedVars
$frontendUrl = if ($env:FRONTEND_URL) { $env:FRONTEND_URL.TrimEnd("/") } else { "https://medicare-tchad.vercel.app" }
$renderServiceName = if ($env:RENDER_SERVICE_NAME) { $env:RENDER_SERVICE_NAME } else { "medicare-tchad-api" }
$vercelProject = if ($env:VERCEL_PROJECT_NAME) { $env:VERCEL_PROJECT_NAME } else { "medicare-tchad" }

Write-Host "[1/6] Test connexion MySQL + migrate..." -ForegroundColor Cyan
Push-Location (Join-Path $root "backend")
try {
    $env:DATABASE_URL = $databaseUrl
    Invoke-Npm npm ci
    Invoke-Npm npx prisma generate
    Invoke-Npm npx prisma migrate deploy
    Write-Host "[OK] Migrations appliquees" -ForegroundColor Green
} finally {
    Pop-Location
}

if (-not $SkipSeed) {
    Write-Host "[2/6] Seed base prod..." -ForegroundColor Cyan
    Push-Location (Join-Path $root "backend")
    try {
        $env:DATABASE_URL = $databaseUrl
        Invoke-Npm npm run db:seed
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
    Write-Host "  Service introuvable - tentative de creation via API Render..." -ForegroundColor Yellow
    $repoUrl = Get-GitHubRepoUrl -RootPath $root
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        throw "Impossible de determiner l URL GitHub (git remote origin). Creez le Blueprint manuellement sur dashboard.render.com/blueprints"
    }
    Write-Host "  Repo: $repoUrl"
    try {
        $ownerId = Get-RenderOwnerId
        $service = New-RenderWebService -Name $renderServiceName -OwnerId $ownerId -RepoUrl $repoUrl -DatabaseUrl $databaseUrl -FrontendUrl $frontendUrl
        Write-Host "[OK] Service Render cree: $($service.id)" -ForegroundColor Green
        Write-Host "  Attente premier deploiement (peut prendre 10-15 min)..."
        Wait-RenderDeploy -ServiceId $service.id | Out-Null
    } catch {
        Write-Host "[ACTION REQUISE] Creation automatique echouee: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  1. https://dashboard.render.com/blueprints -> New Blueprint Instance"
        Write-Host "  2. Repo medicare-tchad, branche main"
        Write-Host "  3. DATABASE_URL + FRONTEND_URL=$frontendUrl"
        Write-Host "  4. Relancez ce script apres statut Live"
        exit 2
    }
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
    $vercelToken = Require-Var -Name "VERCEL_TOKEN" -LoadedVars $loadedVars
    Write-Host "[5/6] Deploiement Vercel..." -ForegroundColor Cyan

    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "  Installation vercel CLI..."
        Invoke-Npm npm install -g vercel
    }

    $env:VERCEL_TOKEN = $vercelToken

    if (-not (Test-Path ".vercel/project.json")) {
        Invoke-Npm vercel link --yes --token $vercelToken --project $vercelProject
    }

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $existingVercelEnv = vercel env ls production --token $vercelToken 2>&1 | Out-String
    $ErrorActionPreference = $prev
    if ($existingVercelEnv -notmatch "VITE_API_URL") {
        "/api/v1" | vercel env add VITE_API_URL production --token $vercelToken --yes
        if ($LASTEXITCODE -ne 0) { throw "vercel env add VITE_API_URL a echoue (code $LASTEXITCODE)" }
    }

    Invoke-Npm vercel deploy --prod --yes --token $vercelToken
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
