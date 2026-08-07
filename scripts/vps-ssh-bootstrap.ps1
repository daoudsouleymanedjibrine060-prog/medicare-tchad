# Configure l'acces SSH au VPS Oracle (cle publique) puis teste la connexion.
# Usage:
#   .\scripts\vps-ssh-bootstrap.ps1 -VpsHost 129.146.x.x -SshUser ubuntu -Wait
param(
    [string]$VpsHost = "",
    [string]$SshUser = "ubuntu",
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
    param([string]$TargetHost, [string]$User = "ubuntu")
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

Write-Host "=== Bootstrap SSH MediCare Tchad (Oracle) ===" -ForegroundColor Cyan
Write-Host "VPS : ${SshUser}@${VpsHost}" -ForegroundColor Green
Write-Host ""

if (Test-SshConnection -TargetHost $VpsHost -User $SshUser) {
    Write-Host "SSH deja fonctionnel." -ForegroundColor Green
    exit 0
}

Write-Host "SSH non configure. Choisissez UNE methode :" -ForegroundColor Yellow
Write-Host ""
Write-Host "Methode A - Console web Oracle (recommandee) :" -ForegroundColor Cyan
Write-Host "  1. Ouvrez https://cloud.oracle.com -> Compute -> Instances -> votre VM"
try { Start-Process "https://cloud.oracle.com" } catch { }
Write-Host "  2. Menu ... -> Console connection / Cloud Shell / serial console"
Write-Host "  3. Connectez-vous en tant que : $SshUser"
Write-Host "  4. Collez cette commande entiere :" -ForegroundColor Yellow
Write-Host $consoleCmd -ForegroundColor White
Write-Host ""
try {
    Set-Clipboard -Value $consoleCmd
    Write-Host "Commande copiee dans le presse-papiers." -ForegroundColor Green
} catch { }

Write-Host ""
Write-Host "Methode B - Recreer l'instance avec la cle SSH a la creation :" -ForegroundColor Cyan
Write-Host "  Compute -> Create instance -> Upload / paste SSH public key"
Write-Host "  Security List : TCP 22, 80, 443"
Write-Host ""
Write-Host "Cle publique :" -ForegroundColor Yellow
Write-Host $pubKey
Write-Host ""

if ($InstallWithPassword) {
    if (-not $env:VPS_ROOT_PASSWORD) {
        Write-Host "VPS_ROOT_PASSWORD non defini (mot de passe $SshUser)." -ForegroundColor Red
        Write-Host ('  $env:VPS_ROOT_PASSWORD="votre-mot-de-passe"; .\scripts\vps-ssh-bootstrap.ps1 -InstallWithPassword -SshUser ' + $SshUser) -ForegroundColor White
        exit 1
    }
    Write-Host "Installation de la cle via mot de passe (WSL)..." -ForegroundColor Cyan
    $winUser = $env:USERNAME
    $wslKey = "/mnt/c/Users/$winUser/.ssh/id_ed25519.pub"
    $pass = $env:VPS_ROOT_PASSWORD -replace "'", "'\\''"
    wsl -d Ubuntu -- bash -lc "set -e; command -v sshpass >/dev/null || (sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sshpass openssh-client); export SSHPASS='$pass'; sshpass -e ssh-copy-id -o StrictHostKeyChecking=accept-new -i '$wslKey' ${SshUser}@$VpsHost"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Echec ssh-copy-id. Verifiez le mot de passe $SshUser." -ForegroundColor Red
        exit 1
    }
}

if ($Wait) {
    Write-Host "Attente de la connexion SSH (max ${WaitSeconds}s)..." -ForegroundColor Cyan
    $deadline = (Get-Date).AddSeconds($WaitSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-SshConnection -TargetHost $VpsHost -User $SshUser) {
            Write-Host "SSH OK !" -ForegroundColor Green
            exit 0
        }
        Start-Sleep -Seconds $PollInterval
        Write-Host "  ... en attente ($PollInterval s)"
    }
    Write-Host "Timeout : SSH toujours inaccessible. Verifiez Security List (port 22) + Methode A/B." -ForegroundColor Red
    exit 1
}

Write-Host "Apres avoir ajoute la cle, testez :" -ForegroundColor Cyan
Write-Host "  ssh ${SshUser}@${VpsHost}" -ForegroundColor White
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-ssh-bootstrap.ps1 -VpsHost $VpsHost -SshUser $SshUser -Wait" -ForegroundColor White
exit 1
