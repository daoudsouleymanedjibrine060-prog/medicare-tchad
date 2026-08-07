# Deploiement complet Oracle Cloud : SSH -> domaine -> install -> verification
param(
    [Parameter(Mandatory = $true)]
    [string]$VpsHost,
    [string]$SshUser = "ubuntu",
    [string]$PreferredDomain = "medicare-tchad.com",
    [string]$Email = "admin@medicare-tchad.com",
    [switch]$UseLocalCode,
    [switch]$SkipSshWait,
    [int]$SshWaitSeconds = 600
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not $UseLocalCode) { $UseLocalCode = $true }

Write-Host "=== Deploiement complet MediCare Tchad (Oracle Cloud) ===" -ForegroundColor Cyan
Write-Host "SSH : ${SshUser}@${VpsHost}" -ForegroundColor Green

$domain = & "$PSScriptRoot\vps-resolve-domain.ps1" -PreferredDomain $PreferredDomain -VpsHost $VpsHost
$domain = ($domain | Select-Object -Last 1).Trim()
Write-Host "Domaine : $domain" -ForegroundColor Green

if (-not $SkipSshWait) {
    & "$PSScriptRoot\vps-ssh-bootstrap.ps1" -VpsHost $VpsHost -SshUser $SshUser -Wait -WaitSeconds $SshWaitSeconds -PollInterval 10
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

wsl -d Ubuntu -- echo "WSL OK" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WSL Ubuntu requis pour -UseLocalCode (archive tar). Installez-le depuis Microsoft Store, ou utilisez le clone GitHub sans -UseLocalCode." -ForegroundColor Yellow
}

& "$PSScriptRoot\vps-remote-install.ps1" -UseLocalCode:$UseLocalCode -VpsHost $VpsHost -SshUser $SshUser -Domain $domain -Email $Email
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot\vps-verify.ps1" -Domain $domain
exit $LASTEXITCODE
