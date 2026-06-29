# Affiche la cle SSH publique et les etapes pour l'ajouter sur Hetzner.
# Une fois la cle ajoutee au serveur, relancez vps-remote-install.ps1
param(
    [string]$VpsHost = ""
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

Write-Host "=== Configuration SSH pour le VPS MediCare Tchad ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cle publique (a ajouter sur Hetzner) :" -ForegroundColor Yellow
Write-Host $pubKey.Trim()
Write-Host ""
try {
    Set-Clipboard -Value $pubKey.Trim()
    Write-Host "Cle copiee dans le presse-papiers." -ForegroundColor Green
} catch { }

Write-Host "Etapes Hetzner Cloud :" -ForegroundColor Cyan
Write-Host "  1. https://console.hetzner.cloud -> votre serveur"
Write-Host "  2. Power -> Reset -> cochez votre cle SSH (ou Rescue pour ajouter manuellement)"
Write-Host "  3. Security -> SSH Keys -> Add SSH Key (pour les futurs serveurs)"
Write-Host "     Cle a coller : voir ci-dessus (deja dans le presse-papiers)"
if ($VpsHost) {
    Write-Host ""
    Write-Host "VPS detecte : root@$VpsHost" -ForegroundColor Green
    Write-Host "Test : ssh root@$VpsHost" -ForegroundColor White
    Write-Host ""
    Write-Host "Puis deploiement :" -ForegroundColor Cyan
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-remote-install.ps1 -UseLocalCode -VpsHost $VpsHost" -ForegroundColor White
}
