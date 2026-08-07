# DEPRECATED : redirige vers Oracle Cloud Always Free.
# Conservé pour compatibilité des anciennes commandes Hetzner.
param(
    [string]$NewVpsHost = ""
)

Write-Host "vps-hetzner-create.ps1 est obsolete." -ForegroundColor Yellow
Write-Host "MediCare Tchad utilise Oracle Cloud Always Free (gratuit)." -ForegroundColor Cyan
Write-Host "Redirection vers scripts\vps-oracle-create.ps1 ..." -ForegroundColor Green
Write-Host ""

& "$PSScriptRoot\vps-oracle-create.ps1" -NewVpsHost $NewVpsHost
exit $LASTEXITCODE
