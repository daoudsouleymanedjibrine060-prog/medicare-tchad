# Publier la release GitHub v1.0.0
param(
    [string]$Tag = "v1.0.0",
    [string]$NotesFile = "CHANGELOG.md"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== Release GitHub MediCare Tchad ($Tag) ===" -ForegroundColor Cyan

if (-not (Test-Path $NotesFile)) {
    Write-Host "Fichier introuvable: $NotesFile" -ForegroundColor Red
    exit 1
}

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "GitHub CLI non authentifie." -ForegroundColor Yellow
    Write-Host "Option A - Authentification interactive :" -ForegroundColor Cyan
    Write-Host "  gh auth login"
    Write-Host "Option B - Token (variable d'environnement) :" -ForegroundColor Cyan
    Write-Host '  $env:GH_TOKEN = "ghp_..."'
    Write-Host "Option C - Interface web GitHub :" -ForegroundColor Cyan
    Write-Host "  https://github.com/daoudsouleymanedjibrine060-prog/medicare-tchad/releases/new?tag=$Tag"
    Write-Host ""
    Write-Host "Corps de release suggere (extrait de $NotesFile) :" -ForegroundColor Green
    Get-Content $NotesFile -TotalCount 25
    exit 2
}

git fetch --tags origin 2>$null
$remoteTag = git ls-remote --tags origin "refs/tags/$Tag" 2>$null
if (-not $remoteTag) {
    Write-Host "Tag $Tag absent sur origin. Poussez-le :" -ForegroundColor Yellow
    Write-Host "  git push origin $Tag"
    exit 1
}

gh release view $Tag 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Release $Tag existe deja." -ForegroundColor Green
    gh release view $Tag --web 2>$null
    exit 0
}

$title = "MediCare Tchad $Tag"
gh release create $Tag --title $title --notes-file $NotesFile
if ($LASTEXITCODE -eq 0) {
    Write-Host "Release creee avec succes." -ForegroundColor Green
    gh release view $Tag --web 2>$null
    exit 0
}

Write-Host "Echec creation release." -ForegroundColor Red
exit 1
