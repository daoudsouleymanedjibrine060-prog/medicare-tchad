# Guide pas a pas : console Hetzner pour debloquer SSH, puis deploiement auto.
param(
    [string]$VpsHost = "95.217.48.123",
    [switch]$SkipDeploy,
    [switch]$AutoWait,
    [int]$WaitSeconds = 300
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
$pubKey = (Get-Content "$keyPath.pub" -Raw).Trim()
$consoleCmd = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo CLE_AJOUTEE"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " GUIDE CONSOLE HETZNER - MediCare Tchad" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT : vous etes dans le bon dossier ?" -ForegroundColor Yellow
Write-Host "  $(Get-Location)" -ForegroundColor White
Write-Host "  (utilisez C:\Users\daoud\medicare-tchad)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Etape 1 - Ouvrir Hetzner Cloud" -ForegroundColor Green
Write-Host "  https://console.hetzner.cloud"
try { Start-Process "https://console.hetzner.cloud" } catch { }
Write-Host ""
Write-Host "Etape 2 - Selectionner votre projet puis le serveur" -ForegroundColor Green
Write-Host "  IP attendue : $VpsHost"
Write-Host ""
Write-Host "Etape 3 - Mot de passe root (si vous ne l'avez pas)" -ForegroundColor Green
Write-Host "  Onglet du serveur -> Rescue (ou Access) -> Reset root password"
Write-Host "  Le mot de passe arrive par e-mail (verifiez les spams)"
Write-Host ""
Write-Host "Etape 4 - Ouvrir la console navigateur" -ForegroundColor Green
Write-Host "  Onglet Console (icone >_) en haut du serveur"
Write-Host "  Cliquez pour ouvrir le terminal dans le navigateur"
Write-Host ""
Write-Host "Etape 5 - Se connecter" -ForegroundColor Green
Write-Host "  Login : root"
Write-Host "  Password : le mot de passe recu par e-mail"
Write-Host ""
Write-Host "Etape 6 - Coller cette commande (deja dans le presse-papiers) :" -ForegroundColor Green
Write-Host $consoleCmd -ForegroundColor White
Write-Host ""
try {
    Set-Clipboard -Value $consoleCmd
    Write-Host "Commande copiee dans le presse-papiers." -ForegroundColor Green
} catch { }
Write-Host ""
Write-Host "Etape 7 - Verifier" -ForegroundColor Green
Write-Host "  Le serveur doit afficher : CLE_AJOUTEE"
Write-Host ""
if ($AutoWait) {
    Write-Host "Etape 8 - Attente automatique SSH (${WaitSeconds}s) pendant que vous configurez la console..." -ForegroundColor Yellow
} else {
    Write-Host "Etape 8 - Appuyez sur Entree ici pour tester SSH et lancer le deploiement..." -ForegroundColor Yellow
    Read-Host "Quand CLE_AJOUTEE est affiche, appuyez sur Entree"
}

& "$PSScriptRoot\vps-ssh-bootstrap.ps1" -VpsHost $VpsHost -Wait -WaitSeconds $WaitSeconds -PollInterval 10
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "SSH echoue encore. Verifiez les etapes 3-7." -ForegroundColor Red
    Write-Host "Test manuel : ssh root@$VpsHost" -ForegroundColor White
    exit 1
}

if ($SkipDeploy) { exit 0 }

Write-Host ""
Write-Host "SSH OK - lancement du deploiement..." -ForegroundColor Green
& "$PSScriptRoot\vps-deploy-all.ps1" -VpsHost $VpsHost -SkipSshWait
exit $LASTEXITCODE
