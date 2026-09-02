# Guide et vérification déploiement Vercel + Render + MySQL
# Usage:
#   .\scripts\deploy-vercel-render.ps1
#   .\scripts\deploy-vercel-render.ps1 -VercelDomain medicare-tchad.vercel.app -RenderHost medicare-tchad-api.onrender.com
param(
    [string]$VercelDomain = "medicare-tchad.vercel.app",
    [string]$RenderHost = "medicare-tchad-api.onrender.com"
)

$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== MediCare Tchad - Deploiement Vercel + Render ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Prerequis (comptes gratuits) :" -ForegroundColor Yellow
Write-Host "  1. MySQL : Aiven ou Railway -> DATABASE_URL"
Write-Host "  2. Render : dashboard.render.com -> Blueprint render.yaml ou Web Service backend/"
Write-Host "  3. Vercel  : vercel.com -> Import GitHub, VITE_API_URL=/api/v1"
Write-Host ""
Write-Host "Documentation : docs/VERCEL_RENDER.md"
Write-Host ""

if (-not (Test-Path "vercel.json")) {
    Write-Host "Erreur : vercel.json introuvable" -ForegroundColor Red
    exit 1
}

$vercelJson = Get-Content "vercel.json" -Raw
if ($vercelJson -match "REPLACE_ME") {
    Write-Host "[TODO] Mettre a jour vercel.json avec l'URL Render reelle" -ForegroundColor Yellow
}

Write-Host "Test Render https://${RenderHost}/api/v1/health ..." -ForegroundColor Cyan
try {
    $render = Invoke-RestMethod -Uri "https://${RenderHost}/api/v1/health" -TimeoutSec 30
    if ($render.status -eq "ok") {
        Write-Host "[OK] API Render" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Render repond mais status inattendu" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[TODO] API Render inaccessible : $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "       Creez le service sur Render puis relancez ce script."
}

Write-Host ""
Write-Host "Test Vercel https://${VercelDomain}/api/v1/health ..." -ForegroundColor Cyan
try {
    $vercel = Invoke-RestMethod -Uri "https://${VercelDomain}/api/v1/health" -TimeoutSec 30
    if ($vercel.status -eq "ok") {
        Write-Host "[OK] Proxy Vercel -> Render" -ForegroundColor Green
    }
} catch {
    Write-Host "[TODO] Vercel inaccessible : $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "       Importez le repo sur vercel.com puis redeploy."
}

Write-Host ""
Write-Host "URLs :" -ForegroundColor Cyan
Write-Host "  Frontend : https://${VercelDomain}/"
Write-Host "  API directe : https://${RenderHost}/api/v1/health"
Write-Host ""
Write-Host "Apres seed prod :" -ForegroundColor Cyan
Write-Host "  Patient : patient@medicare-td.test / Patient@123"
Write-Host "  Medecin : dr.hassan@medicare-td.test / Admin@123  (/connexion/medecin)"
