# Lance l'installation MediCare Tchad sur le VPS via SSH (depuis Windows).
# Les commandes apt/git/bash s'executent sur le serveur Linux, pas dans PowerShell.
#
# Usage:
#   .\scripts\vps-remote-install.ps1 -VpsHost 95.217.48.123 -GitHubRepo https://github.com/USER/medicare-tchad.git
#   .\scripts\vps-remote-install.ps1 -Interactive   # ouvre SSH + copie les commandes bash
param(
    [string]$VpsHost = "",
    [string]$GitHubRepo = "",
    [string]$Domain = "medicare-tchad.com",
    [string]$Email = "admin@medicare-tchad.com",
    [string]$SshUser = "root",
    [switch]$Interactive,
    [switch]$ManualClone,
    [switch]$UseLocalCode
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

function Get-VpsHostFromKnownHosts {
    $knownHosts = Join-Path $env:USERPROFILE ".ssh\known_hosts"
    if (-not (Test-Path $knownHosts)) { return "" }
    $line = Get-Content $knownHosts | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+' } | Select-Object -First 1
    if ($line -match '^(\d+\.\d+\.\d+\.\d+)') { return $matches[1] }
    return ""
}

function Get-GitHubRepoFromOrigin {
    $url = git remote get-url origin 2>$null
    if (-not $url) { return "" }
    if ($url -match 'github\.com[:/](.+?)(?:\.git)?$') {
        return "https://github.com/$($matches[1]).git"
    }
    return $url
}

if (-not $VpsHost) {
    $VpsHost = Get-VpsHostFromKnownHosts
}
if (-not $GitHubRepo) {
    $GitHubRepo = Get-GitHubRepoFromOrigin
}

$bashOneLiner = @"
curl -fsSL https://raw.githubusercontent.com/$(if ($GitHubRepo -match 'github\.com/([^/]+/[^/.]+)') { $matches[1] } else { 'VOTRE_COMPTE/medicare-tchad' })/main/scripts/vps-first-install.sh | bash -s -- --repo '$GitHubRepo' --domain '$Domain' --email '$Email'
"@.Trim()

$bashManual = @"
apt update && apt install -y git
git clone '$GitHubRepo' /opt/medicare-tchad
cd /opt/medicare-tchad
chmod +x scripts/*.sh
./scripts/vps-first-install.sh --domain '$Domain' --email '$Email'
"@.Trim()

Write-Host "=== Installation VPS MediCare Tchad (depuis Windows) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ces commandes s'executent sur le VPS Ubuntu via SSH, pas dans PowerShell." -ForegroundColor Yellow
Write-Host ""

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "OpenSSH client manquant. Installez-le : Parametres > Applications > Fonctionnalites optionnelles > Client OpenSSH" -ForegroundColor Red
    exit 1
}

if (-not $VpsHost) {
    Write-Host "IP du VPS inconnue. Passez -VpsHost <ip> ou connectez-vous une fois en SSH pour remplir ~/.ssh/known_hosts" -ForegroundColor Red
    exit 1
}

if (-not $GitHubRepo -or $GitHubRepo -match 'VOTRE_COMPTE') {
    Write-Host "URL GitHub manquante. Passez -GitHubRepo https://github.com/USER/medicare-tchad.git" -ForegroundColor Red
    Write-Host "Ou configurez le remote : git remote add origin https://github.com/USER/medicare-tchad.git" -ForegroundColor Yellow
    exit 1
}

Write-Host "VPS   : ${SshUser}@${VpsHost}" -ForegroundColor Green
Write-Host "Repo  : $GitHubRepo" -ForegroundColor Green
Write-Host "Domaine: $Domain" -ForegroundColor Green
Write-Host ""

$tcp = Test-NetConnection -ComputerName $VpsHost -Port 22 -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) {
    Write-Host "Port SSH 22 inaccessible sur $VpsHost" -ForegroundColor Red
    exit 1
}

if ($Interactive) {
    try {
        Set-Clipboard -Value $bashManual
        Write-Host "Commandes bash copiees dans le presse-papiers." -ForegroundColor Green
    } catch {
        Write-Host "Commandes bash a coller sur le VPS :" -ForegroundColor Yellow
        Write-Host $bashManual
    }
    Write-Host ""
    Write-Host "Connexion SSH interactive. Collez les commandes bash une fois connecte." -ForegroundColor Cyan
    ssh "${SshUser}@${VpsHost}"
    exit $LASTEXITCODE
}

$remoteCmd = if ($ManualClone) { $bashManual } else { $bashOneLiner }
$escaped = $remoteCmd.Replace("'", "'\''")

Write-Host "Connexion SSH et lancement de l'installation..." -ForegroundColor Cyan
ssh -o BatchMode=yes -o ConnectTimeout=15 "${SshUser}@${VpsHost}" "bash -lc '$escaped'"
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "Echec SSH (code $exitCode). Causes frequentes :" -ForegroundColor Red
    Write-Host "  - Pas de cle SSH configuree sur ce PC"
    Write-Host "  - Mot de passe requis (mode interactif)"
    Write-Host ""
    Write-Host "Solution : lancez en mode interactif :" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-remote-install.ps1 -Interactive -VpsHost $VpsHost -GitHubRepo `"$GitHubRepo`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou connectez-vous manuellement :" -ForegroundColor Yellow
    Write-Host "  ssh ${SshUser}@${VpsHost}" -ForegroundColor White
    exit $exitCode
}

Write-Host ""
Write-Host "Installation terminee sur le VPS." -ForegroundColor Green
Write-Host "Verification : powershell -ExecutionPolicy Bypass -File scripts\vps-verify.ps1 -Domain $Domain" -ForegroundColor Cyan
