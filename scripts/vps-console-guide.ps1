# Guide pas a pas : console Oracle Cloud pour debloquer SSH, puis deploiement auto.
param(
    [string]$VpsHost = "",
    [string]$SshUser = "ubuntu",
    [switch]$SkipDeploy,
    [switch]$AutoWait,
    [int]$WaitSeconds = 300
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not $VpsHost) {
    Write-Host "Passez -VpsHost <IP_PUBLIQUE_ORACLE>" -ForegroundColor Red
    exit 1
}

$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path "$keyPath.pub")) {
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "medicare-tchad-deploy"
}
$pubKey = (Get-Content "$keyPath.pub" -Raw).Trim()
$consoleCmd = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo CLE_AJOUTEE"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " GUIDE CONSOLE ORACLE - MediCare Tchad" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT : vous etes dans le bon dossier ?" -ForegroundColor Yellow
Write-Host "  $(Get-Location)" -ForegroundColor White
Write-Host ""
Write-Host "Etape 1 - Ouvrir Oracle Cloud" -ForegroundColor Green
Write-Host "  https://cloud.oracle.com"
try { Start-Process "https://cloud.oracle.com" } catch { }
Write-Host ""
Write-Host "Etape 2 - Compute -> Instances -> votre serveur ($VpsHost)" -ForegroundColor Green
Write-Host ""
Write-Host "Etape 3 - Verifier Security List : TCP 22, 80, 443" -ForegroundColor Green
Write-Host "  Networking -> VCN -> Security Lists -> Ingress Rules"
Write-Host ""
Write-Host "Etape 4 - Console / Cloud Shell connexion a la VM" -ForegroundColor Green
Write-Host "  Login : $SshUser"
Write-Host ""
Write-Host "Etape 5 - Coller cette commande (presse-papiers) :" -ForegroundColor Green
Write-Host $consoleCmd -ForegroundColor White
Write-Host ""
try {
    Set-Clipboard -Value $consoleCmd
    Write-Host "Commande copiee dans le presse-papiers." -ForegroundColor Green
} catch { }
Write-Host ""
Write-Host "Etape 6 - Verifier : le serveur affiche CLE_AJOUTEE" -ForegroundColor Green
Write-Host ""
if ($AutoWait) {
    Write-Host "Etape 7 - Attente automatique SSH (${WaitSeconds}s)..." -ForegroundColor Yellow
} else {
    Write-Host "Etape 7 - Appuyez sur Entree ici pour tester SSH et lancer le deploiement..." -ForegroundColor Yellow
    Read-Host "Quand CLE_AJOUTEE est affiche, appuyez sur Entree"
}

& "$PSScriptRoot\vps-ssh-bootstrap.ps1" -VpsHost $VpsHost -SshUser $SshUser -Wait -WaitSeconds $WaitSeconds -PollInterval 10
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "SSH echoue encore. Verifiez Security List (22) et les etapes 3-6." -ForegroundColor Red
    Write-Host "Test manuel : ssh ${SshUser}@${VpsHost}" -ForegroundColor White
    exit 1
}

if ($SkipDeploy) { exit 0 }

Write-Host ""
Write-Host "SSH OK - lancement du deploiement..." -ForegroundColor Green
& "$PSScriptRoot\vps-deploy-all.ps1" -VpsHost $VpsHost -SshUser $SshUser -SkipSshWait
exit $LASTEXITCODE
