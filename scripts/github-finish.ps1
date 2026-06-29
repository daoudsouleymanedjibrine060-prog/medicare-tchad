# Finalise le push GitHub apres `gh auth login`.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\github-finish.ps1
param(
    [string]$RepoName = "medicare-tchad",
    [string]$GitHubUser = "daoudsouleymanedjibrine060-prog"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$prevEa = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
gh auth status 2>&1 | Out-Null
$ghAuthed = $LASTEXITCODE -eq 0
$ErrorActionPreference = $prevEa

if (-not $ghAuthed) {
    Write-Host "Connectez-vous d'abord :" -ForegroundColor Yellow
    Write-Host "  gh auth login"
    Write-Host "Puis relancez ce script."
    exit 1
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
    git remote add origin "https://github.com/$GitHubUser/$RepoName.git"
}

Write-Host "Creation du depot $RepoName sur GitHub..." -ForegroundColor Cyan
gh repo create $RepoName --public --source=. --remote=origin --push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creation echouee (depot peut-etre deja cree). Tentative push..." -ForegroundColor Yellow
    git push -u origin main
}

Write-Host ""
Write-Host "Depot :" -ForegroundColor Green
gh repo view --json url -q .url
