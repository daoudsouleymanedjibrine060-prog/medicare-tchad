# Affiche la cle SSH publique et les etapes pour l'ajouter sur Oracle Cloud.
# Une fois la cle ajoutee / les ports ouverts, relancez vps-remote-install.ps1
param(
    [string]$VpsHost = "",
    [string]$SshUser = "ubuntu"
)

$ErrorActionPreference = "Stop"

function Get-VpsHostFromKnownHosts {
    $knownHosts = Join-Path $env:USERPROFILE ".ssh\known_hosts"
    if (-not (Test-Path $knownHosts)) { return "" }
    $line = Get-Content $knownHosts | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+' } | Select-Object -First 1
    if ($line -match '^(\d+\.\d+\.\d+\.\d+)') { return $matches[1] }
    return ""
}

$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $keyPath)) {
    Write-Host "Generation de la cle SSH..." -ForegroundColor Cyan
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "medicare-tchad-deploy"
}

$pubKey = Get-Content "$keyPath.pub" -Raw
if (-not $VpsHost) { $VpsHost = Get-VpsHostFromKnownHosts }

Write-Host "=== Configuration SSH Oracle Cloud - MediCare Tchad ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cle publique (a ajouter a la creation de l'instance Oracle) :" -ForegroundColor Yellow
Write-Host $pubKey.Trim()
Write-Host ""
try {
    Set-Clipboard -Value $pubKey.Trim()
    Write-Host "Cle copiee dans le presse-papiers." -ForegroundColor Green
} catch { }

Write-Host "Etapes Oracle Cloud :" -ForegroundColor Cyan
Write-Host "  1. https://cloud.oracle.com -> Compute -> Instances"
Write-Host "  2. Create instance : Ubuntu 22.04 + shape A1.Flex + coller la cle SSH"
Write-Host "  3. VCN Security List : Ingress TCP 22, 80, 443"
Write-Host "  4. SSH utilisateur : $SshUser (Canonical Ubuntu sur OCI)"
Write-Host "  Doc : docs/ORACLE_CLOUD.md"
if ($VpsHost) {
    Write-Host ""
    Write-Host "VPS detecte : ${SshUser}@${VpsHost}" -ForegroundColor Green
    Write-Host "Test : ssh ${SshUser}@${VpsHost}" -ForegroundColor White
    Write-Host ""
    Write-Host "Puis deploiement :" -ForegroundColor Cyan
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-remote-install.ps1 -UseLocalCode -VpsHost $VpsHost -SshUser $SshUser" -ForegroundColor White
}
