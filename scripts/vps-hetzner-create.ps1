# Guide creation d'un nouveau VPS Hetzner avec cle SSH pre-configuree.
# Apres creation du serveur, notez l'IP et lancez le deploiement.
param(
    [string]$NewVpsHost = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $keyPath)) {
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "medicare-tchad-deploy"
}
$pubKey = (Get-Content "$keyPath.pub" -Raw).Trim()

Write-Host "=== Nouveau VPS Hetzner pour MediCare Tchad ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Etape 1 - Ajouter la cle SSH (une seule fois) :" -ForegroundColor Yellow
Write-Host "  https://console.hetzner.cloud -> Security -> SSH Keys -> Add SSH Key"
Write-Host "  Nom : medicare-tchad-deploy"
Write-Host "  Cle :" -ForegroundColor White
Write-Host $pubKey
Write-Host ""
try {
    Set-Clipboard -Value $pubKey.Trim()
    Write-Host "Cle copiee dans le presse-papiers." -ForegroundColor Green
} catch { }

Write-Host "Etape 2 - Creer le serveur :" -ForegroundColor Yellow
Write-Host "  https://console.hetzner.cloud -> Add Server"
Write-Host "  Image    : Ubuntu 22.04"
Write-Host "  Type     : CX22 (2 vCPU, 4 GB RAM)"
Write-Host "  Location : Falkenstein ou Nuremberg"
Write-Host "  SSH Keys : cochez medicare-tchad-deploy"
Write-Host "  Reseau   : IPv4 publique activee"
Write-Host ""
Write-Host "Etape 3 - Noter l'IPv4 affichee (ex. 95.xxx.xxx.xxx)" -ForegroundColor Yellow
Write-Host ""

if ($NewVpsHost) {
    Write-Host "Test SSH sur $NewVpsHost ..." -ForegroundColor Cyan
    & "$PSScriptRoot\vps-ssh-bootstrap.ps1" -VpsHost $NewVpsHost -Wait -WaitSeconds 120 -PollInterval 5
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SSH OK. Lancement du deploiement..." -ForegroundColor Green
        $domain = & "$PSScriptRoot\vps-resolve-domain.ps1" -VpsHost $NewVpsHost | Select-Object -Last 1
        & "$PSScriptRoot\vps-remote-install.ps1" -UseLocalCode -VpsHost $NewVpsHost -Domain $domain.Trim() -Email "admin@medicare-tchad.com"
        if ($LASTEXITCODE -eq 0) {
            & "$PSScriptRoot\vps-verify.ps1" -Domain $domain.Trim()
        }
        exit $LASTEXITCODE
    }
    exit $LASTEXITCODE
}

Write-Host "Etape 4 - Deploiement (remplacez IP) :" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-hetzner-create.ps1 -NewVpsHost VOTRE_IP" -ForegroundColor White
Write-Host ""
Write-Host "Ou tout-en-un :" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-deploy-all.ps1 -VpsHost VOTRE_IP" -ForegroundColor White
