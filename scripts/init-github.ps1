# Initialise le dépôt Git et prépare le push GitHub
# Usage: .\scripts\init-github.ps1 [-RepoName medicare-tchad] [-Private]
param(
    [string]$RepoName = "medicare-tchad",
    [switch]$Private
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "=== Initialisation Git MediCare Tchad ===" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git n'est pas installé. Installez Git for Windows." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
    Write-Host "Dépôt Git initialisé." -ForegroundColor Green
} else {
    Write-Host "Dépôt Git existant." -ForegroundColor Yellow
}

git add .
$status = git status --porcelain
if ($status) {
    git commit -m "MediCare Tchad - version production deployable"
    Write-Host "Commit créé." -ForegroundColor Green
} else {
    Write-Host "Rien à committer." -ForegroundColor Yellow
}

$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghAvailable) {
    Write-Host ""
    Write-Host "GitHub CLI (gh) non installé." -ForegroundColor Yellow
    Write-Host "1. Installez gh : https://cli.github.com/"
    Write-Host "2. gh auth login"
    Write-Host "3. Relancez ce script"
    Write-Host ""
    Write-Host "Ou ajoutez le remote manuellement :"
    Write-Host "  git remote add origin https://github.com/VOTRE_COMPTE/$RepoName.git"
    Write-Host "  git push -u origin main"
    exit 0
}

$prevEa = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
gh auth status 2>&1 | Out-Null
$ghAuthed = $LASTEXITCODE -eq 0
$ErrorActionPreference = $prevEa

if (-not $ghAuthed) {
    Write-Host ""
    Write-Host "Non connecte a GitHub. Executez :" -ForegroundColor Yellow
    Write-Host "  gh auth login"
    Write-Host "Puis relancez : .\scripts\init-github.ps1"
    Write-Host ""
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "Remote deja configure : $existingRemote" -ForegroundColor Green
        Write-Host "Apres gh auth login :" -ForegroundColor Yellow
        Write-Host "  gh repo create $RepoName --public --source=. --push"
        Write-Host "  # ou si le depot existe deja sur GitHub : git push -u origin main"
    } else {
        Write-Host "Le commit local est pret. Remote manuel :" -ForegroundColor Green
        Write-Host "  git remote add origin https://github.com/VOTRE_COMPTE/$RepoName.git"
        Write-Host "  git push -u origin main"
    }
    exit 0
}

$visibility = if ($Private) { "--private" } else { "--public" }
$existing = git remote get-url origin 2>$null
if (-not $existing) {
    Write-Host "Création du dépôt GitHub $RepoName..."
    gh repo create $RepoName $visibility --source=. --remote=origin --push
    Write-Host "Dépôt créé et code poussé." -ForegroundColor Green
} else {
    Write-Host "Remote origin existe : $existing"
    git push -u origin main
    Write-Host "Code poussé." -ForegroundColor Green
}

Write-Host ""
Write-Host "URL du dépôt :" -ForegroundColor Green
gh repo view --json url -q .url
