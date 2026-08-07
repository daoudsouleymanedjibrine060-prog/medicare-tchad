# Prepare / verify Oracle Cloud deployment readiness (no IP = checklist only).
# Usage:
#   .\scripts\oracle-deploy-ready.ps1
#   .\scripts\oracle-deploy-ready.ps1 -VpsHost 129.146.x.x
param(
    [string]$VpsHost = "",
    [string]$SshUser = "ubuntu"
)

$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== MediCare Tchad - readiness Oracle Cloud (v1.0.0) ===" -ForegroundColor Cyan
Write-Host ""

$pending = 0
function Show-Check {
    param([string]$Name, [bool]$Ok, [string]$Detail)
    if (-not $Ok) { $script:pending++ }
    $tag = if ($Ok) { "OK" } else { "TODO" }
    $color = if ($Ok) { "Green" } else { "Yellow" }
    Write-Host "[$tag] $Name - $Detail" -ForegroundColor $color
}

Show-Check "Repo GitHub" $true "https://github.com/daoudsouleymanedjibrine060-prog/medicare-tchad"
Show-Check "Docs Oracle" (Test-Path "docs\ORACLE_CLOUD.md") "docs/ORACLE_CLOUD.md"
Show-Check "Script deploy" (Test-Path "scripts\vps-deploy-all.ps1") "scripts/vps-deploy-all.ps1 -SshUser ubuntu"
Show-Check "SSL script" (Test-Path "scripts\setup-ssl.sh") "scripts/setup-ssl.sh"
Show-Check "Backup cron" (Test-Path "scripts\install-cron.sh") "backup quotidien via install-cron.sh"

if (-not $VpsHost) {
    Show-Check "IP Oracle fournie" $false "Passez -VpsHost IP apres creation de la VM"
    Write-Host ""
    Write-Host "Prochaines etapes (une fois la VM creee) :" -ForegroundColor Cyan
    Write-Host "  1. Security List OCI : TCP 22, 80, 443"
    Write-Host "  2. powershell -ExecutionPolicy Bypass -File scripts\vps-oracle-create.ps1 -NewVpsHost VOTRE_IP"
    Write-Host "  3. Ou : scripts\vps-deploy-all.ps1 -VpsHost VOTRE_IP -SshUser ubuntu"
    Write-Host "  4. Domaine A record ou sslip.io + SSL"
    Write-Host ""
    if ($pending -gt 0) { exit 2 }
    exit 0
}

Write-Host ""
Write-Host "Test SSH ${SshUser}@${VpsHost} ..." -ForegroundColor Cyan
ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "${SshUser}@${VpsHost}" "echo SSH_OK" 2>$null
if ($LASTEXITCODE -eq 0) {
    Show-Check "SSH Oracle" $true "${SshUser}@${VpsHost}"
    Write-Host ""
    Write-Host "SSH OK - lancement du deploiement..." -ForegroundColor Green
    & "$PSScriptRoot\vps-deploy-all.ps1" -VpsHost $VpsHost -SshUser $SshUser
    exit $LASTEXITCODE
}

Show-Check "SSH Oracle" $false "Timeout / cle manquante - voir docs/ORACLE_CLOUD.md"
Write-Host ""
Write-Host "Corrigez SSH puis relancez :" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\oracle-deploy-ready.ps1 -VpsHost $VpsHost"
exit 1
