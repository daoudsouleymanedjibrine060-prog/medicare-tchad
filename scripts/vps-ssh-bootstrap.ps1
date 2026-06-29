# Configure l'acces SSH au VPS (cle publique) puis teste la connexion.
# Usage:
#   .\scripts\vps-ssh-bootstrap.ps1
#   .\scripts\vps-ssh-bootstrap.ps1 -VpsHost 95.217.48.123 -Wait
#   $env:VPS_ROOT_PASSWORD='...'; .\scripts\vps-ssh-bootstrap.ps1 -InstallWithPassword
param(
    [string]$VpsHost = "",
    [switch]$InstallWithPassword,
    [switch]$Wait,
    [int]$WaitSeconds = 300,
    [int]$PollInterval = 10
)

$ErrorActionPreference = "Stop"

function Get-VpsHostFromKnownHosts {
    $knownHosts = Join-Path $env:USERPROFILE ".ssh\known_hosts"
    if (-not (Test-Path $knownHosts)) { return "" }
    $line = Get-Content $knownHosts | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+' } | Select-Object -First 1
    if ($line -match '^(\d+\.\d+\.\d+\.\d+)') { return $matches[1] }
    return ""
}

function Test-SshConnection {
    param([string]$TargetHost, [string]$User = "root")
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new "${User}@${TargetHost}" "echo SSH_OK" 2>$null | Out-Null
    $ok = $LASTEXITCODE -eq 0
    $ErrorActionPreference = $prev
    return $ok
}

$keyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $keyPath)) {
    Write-Host "Generation de la cle SSH..." -ForegroundColor Cyan
    ssh-keygen -t ed25519 -f $keyPath -N '""' -C "medicare-tchad-deploy"
}

if (-not $VpsHost) { $VpsHost = Get-VpsHostFromKnownHosts }
if (-not $VpsHost) {
    Write-Host "IP VPS inconnue. Passez -VpsHost <ip>" -ForegroundColor Red
    exit 1
}

$pubKey = (Get-Content "$keyPath.pub" -Raw).Trim()
$consoleCmd = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo CLE_AJOUTEE"

Write-Host "=== Bootstrap SSH MediCare Tchad ===" -ForegroundColor Cyan
Write-Host "VPS : root@$VpsHost" -ForegroundColor Green
Write-Host ""

if (Test-SshConnection -TargetHost $VpsHost) {
    Write-Host "SSH deja fonctionnel." -ForegroundColor Green
    exit 0
}

Write-Host "SSH non configure. Choisissez UNE methode :" -ForegroundColor Yellow
Write-Host ""
Write-Host "Methode A - Console web Hetzner (recommandee) :" -ForegroundColor Cyan
Write-Host "  1. Ouvrez https://console.hetzner.cloud"
try { Start-Process "https://console.hetzner.cloud" } catch { }
Write-Host "  2. Cliquez votre serveur -> onglet Console"
Write-Host "  3. Connectez-vous : root + mot de passe (Access -> Reset root password si besoin)"
Write-Host "  4. Collez cette commande entiere :" -ForegroundColor Yellow
Write-Host $consoleCmd -ForegroundColor White
Write-Host ""
try {
    Set-Clipboard -Value $consoleCmd
    Write-Host "Commande copiee dans le presse-papiers." -ForegroundColor Green
} catch { }

Write-Host ""
Write-Host "Methode B - Ajouter la cle dans Hetzner Cloud :" -ForegroundColor Cyan
Write-Host "  Security -> SSH Keys -> Add SSH Key"
Write-Host "  Puis Power -> Rebuild (reinstalle Ubuntu avec la cle)"
Write-Host ""
Write-Host "Cle publique :" -ForegroundColor Yellow
Write-Host $pubKey
Write-Host ""

if ($InstallWithPassword) {
    if (-not $env:VPS_ROOT_PASSWORD) {
        Write-Host "VPS_ROOT_PASSWORD non defini." -ForegroundColor Red
        Write-Host '  $env:VPS_ROOT_PASSWORD="votre-mot-de-passe"; .\scripts\vps-ssh-bootstrap.ps1 -InstallWithPassword' -ForegroundColor White
        exit 1
    }
    Write-Host "Installation de la cle via mot de passe (WSL)..." -ForegroundColor Cyan
    $winUser = $env:USERNAME
    $wslKey = "/mnt/c/Users/$winUser/.ssh/id_ed25519.pub"
    $pass = $env:VPS_ROOT_PASSWORD -replace "'", "'\\''"
    wsl -d Ubuntu -- bash -lc "set -e; command -v sshpass >/dev/null || (sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sshpass openssh-client); export SSHPASS='$pass'; sshpass -e ssh-copy-id -o StrictHostKeyChecking=accept-new -i '$wslKey' root@$VpsHost"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Echec ssh-copy-id. Verifiez le mot de passe root." -ForegroundColor Red
        exit 1
    }
}

if ($Wait) {
    Write-Host "Attente de la connexion SSH (max ${WaitSeconds}s)..." -ForegroundColor Cyan
    $deadline = (Get-Date).AddSeconds($WaitSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-SshConnection -TargetHost $VpsHost) {
            Write-Host "SSH OK !" -ForegroundColor Green
            exit 0
        }
        Start-Sleep -Seconds $PollInterval
        Write-Host "  ... en attente ($PollInterval s)"
    }
    Write-Host "Timeout : SSH toujours inaccessible. Suivez Methode A ou B ci-dessus." -ForegroundColor Red
    exit 1
}

Write-Host "Apres avoir ajoute la cle, testez :" -ForegroundColor Cyan
Write-Host "  ssh root@$VpsHost" -ForegroundColor White
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-ssh-bootstrap.ps1 -Wait" -ForegroundColor White
exit 1
