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
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $url = (git remote get-url origin 2>$null | Out-String).Trim()
    $ErrorActionPreference = $prev
    if (-not $url -or $url -like "error:*") { return "" }
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

$bashLocalInstall = @"
apt update && apt install -y git tar
rm -rf /opt/medicare-tchad
mkdir -p /opt/medicare-tchad
tar xzf /tmp/medicare-tchad.tgz -C /opt/medicare-tchad
cd /opt/medicare-tchad
chmod +x scripts/*.sh
./scripts/vps-first-install.sh --domain '$Domain' --email '$Email'
"@.Trim()

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

$bootstrap = Join-Path $PSScriptRoot "vps-ssh-bootstrap.ps1"
if (Test-Path $bootstrap) {
    & $bootstrap -VpsHost $VpsHost -Wait -WaitSeconds 60 -PollInterval 10
    if ($LASTEXITCODE -ne 0) {
        Write-Host "SSH inaccessible. Lancez : powershell -ExecutionPolicy Bypass -File scripts\vps-ssh-bootstrap.ps1" -ForegroundColor Red
        exit 1
    }
}

if (-not $UseLocalCode -and (-not $GitHubRepo -or $GitHubRepo -match 'VOTRE_COMPTE')) {
    Write-Host "URL GitHub manquante. Options :" -ForegroundColor Red
    Write-Host "  -UseLocalCode (envoie le code local via SCP, sans GitHub)" -ForegroundColor Yellow
    Write-Host "  -GitHubRepo https://github.com/USER/medicare-tchad.git" -ForegroundColor Yellow
    exit 1
}

Write-Host "VPS   : ${SshUser}@${VpsHost}" -ForegroundColor Green
if ($UseLocalCode) {
    Write-Host "Source: code local (SCP)" -ForegroundColor Green
} else {
    Write-Host "Repo  : $GitHubRepo" -ForegroundColor Green
}
Write-Host "Domaine: $Domain" -ForegroundColor Green
Write-Host ""

$tcp = Test-NetConnection -ComputerName $VpsHost -Port 22 -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) {
    Write-Host "Port SSH 22 inaccessible sur $VpsHost" -ForegroundColor Red
    exit 1
}

if ($Interactive) {
    $clip = if ($UseLocalCode) {
        "# 1) Depuis Windows, dans un autre terminal :`n" +
        "powershell -ExecutionPolicy Bypass -File scripts\vps-remote-install.ps1 -UseLocalCode -VpsHost $VpsHost`n`n" +
        "# OU collez sur le VPS apres upload manuel du code :`n$bashLocalInstall"
    } else { $bashManual }
    try {
        Set-Clipboard -Value $clip
        Write-Host "Instructions copiees dans le presse-papiers." -ForegroundColor Green
    } catch {
        Write-Host "Instructions :" -ForegroundColor Yellow
        Write-Host $clip
    }
    Write-Host ""
    Write-Host "Connexion SSH interactive. Collez les commandes bash une fois connecte." -ForegroundColor Cyan
    ssh "${SshUser}@${VpsHost}"
    exit $LASTEXITCODE
}

if ($UseLocalCode) {
    $projectRoot = (Get-Location).Path
    $driveLetter = $projectRoot.Substring(0, 1).ToLower()
    $posixPath = ($projectRoot.Substring(2) -replace '\\', '/')
    $wslRoot = "/mnt/$driveLetter$posixPath"
    Write-Host "Preparation de l'archive locale..." -ForegroundColor Cyan
    wsl -d Ubuntu -- bash -lc "set -e; tar czf /tmp/medicare-tchad.tgz -C '$wslRoot' --exclude=node_modules --exclude=.git --exclude=dist --exclude=backend/node_modules --exclude=frontend/node_modules ."
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "Envoi de l'archive vers le VPS..." -ForegroundColor Cyan
    wsl -d Ubuntu -- scp -o BatchMode=yes /tmp/medicare-tchad.tgz "${SshUser}@${VpsHost}:/tmp/medicare-tchad.tgz"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Echec SCP. Essayez le mode interactif (-Interactive)." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    $remoteCmd = $bashLocalInstall
} elseif ($ManualClone) {
    $remoteCmd = $bashManual
} else {
    $remoteCmd = $bashOneLiner
}
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
    if ($UseLocalCode) {
        Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-remote-install.ps1 -Interactive -UseLocalCode -VpsHost $VpsHost" -ForegroundColor White
    } else {
        Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps-remote-install.ps1 -Interactive -VpsHost $VpsHost -GitHubRepo `"$GitHubRepo`"" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Ou connectez-vous manuellement :" -ForegroundColor Yellow
    Write-Host "  ssh ${SshUser}@${VpsHost}" -ForegroundColor White
    exit $exitCode
}

Write-Host ""
Write-Host "Installation terminee sur le VPS." -ForegroundColor Green
Write-Host "Verification : powershell -ExecutionPolicy Bypass -File scripts\vps-verify.ps1 -Domain $Domain" -ForegroundColor Cyan
