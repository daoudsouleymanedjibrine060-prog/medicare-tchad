# Guide creation d'une VM Oracle Cloud Always Free avec cle SSH.
# Apres creation de l'instance, notez l'IP publique et lancez le deploiement.
param(
    [string]$NewVpsHost = "",
    [string]$SshUser = "ubuntu"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $keyPath)) {
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "medicare-tchad-deploy"
}
$pubKey = (Get-Content "$keyPath.pub" -Raw).Trim()

Write-Host "=== Nouvelle VM Oracle Cloud (Always Free) - MediCare Tchad ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Etape 1 - Ajouter la cle SSH (une seule fois) :" -ForegroundColor Yellow
Write-Host "  https://cloud.oracle.com -> Compute -> Instances -> Create instance"
Write-Host "  ou Compute -> Instance Configurations / SSH Keys"
Write-Host "  Cle publique :" -ForegroundColor White
Write-Host $pubKey
Write-Host ""
try {
    Set-Clipboard -Value $pubKey.Trim()
    Write-Host "Cle copiee dans le presse-papiers." -ForegroundColor Green
} catch { }

Write-Host "Etape 2 - Creer l'instance Always Free :" -ForegroundColor Yellow
Write-Host "  https://cloud.oracle.com -> Compute -> Instances -> Create instance"
try { Start-Process "https://cloud.oracle.com" } catch { }
Write-Host "  Image    : Canonical Ubuntu 22.04"
Write-Host "  Shape    : VM.Standard.A1.Flex (Ampere) Always Free - Ideal 2+ OCPU / 12+ Go RAM"
Write-Host "  Network  : Assign public IPv4"
Write-Host "  SSH keys : collez la cle ci-dessus"
Write-Host ""
Write-Host "Etape 3 - Security List (VCN) : Ingress TCP 22, 80, 443" -ForegroundColor Yellow
Write-Host "  Voir docs/ORACLE_CLOUD.md"
Write-Host ""
Write-Host "Etape 4 - Noter l'IPv4 publique de l'instance" -ForegroundColor Yellow
Write-Host "  SSH utilisateur Oracle Ubuntu : $SshUser (pas root)" -ForegroundColor White
Write-Host ""

if ($NewVpsHost) {
    Write-Host "Test SSH sur ${SshUser}@${NewVpsHost} ..." -ForegroundColor Cyan
    & "$PSScriptRoot\vps-ssh-bootstrap.ps1" -VpsHost $NewVpsHost -SshUser $SshUser -Wait -WaitSeconds 120 -PollInterval 5
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SSH OK. Lancement du deploiement..." -ForegroundColor Green
        $domain = & "$PSScriptRoot\vps-resolve-domain.ps1" -VpsHost $NewVpsHost | Select-Object -Last 1
        & "$PSScriptRoot\vps-remote-install.ps1" -UseLocalCode -VpsHost $NewVpsHost -SshUser $SshUser -Domain $domain.Trim() -Email "admin@medicare-tchad.com"
        if ($LASTEXITCODE -eq 0) {
            & "$PSScriptRoot\vps-verify.ps1" -Domain $domain.Trim()
        }
        exit $LASTEXITCODE
    }
    exit $LASTEXITCODE
}

Write-Host "Etape 5 - Deploiement (remplacez IP) :" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-oracle-create.ps1 -NewVpsHost VOTRE_IP" -ForegroundColor White
Write-Host ""
Write-Host "Ou tout-en-un :" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-deploy-all.ps1 -VpsHost VOTRE_IP -SshUser ubuntu" -ForegroundColor White
Write-Host ""
Write-Host "Documentation : docs/ORACLE_CLOUD.md  |  docs/VPS_ONBOARDING.md" -ForegroundColor Cyan
