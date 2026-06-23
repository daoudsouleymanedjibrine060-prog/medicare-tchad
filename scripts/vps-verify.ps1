# Verifie le deploiement production depuis Windows (DNS + HTTPS + API health).
# Usage: .\scripts\vps-verify.ps1 [-Domain medicare-tchad.com]
param(
    [string]$Domain = "medicare-tchad.com"
)

$ErrorActionPreference = "Continue"
$baseUrl = "https://$Domain"
$healthUrl = "$baseUrl/api/v1/health"

Write-Host "=== Verification deploiement MediCare Tchad ===" -ForegroundColor Cyan
Write-Host "Domaine: $Domain"
Write-Host ""

Write-Host -NoNewline "DNS (A record)... "
try {
    $dns = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop
    $ip = ($dns | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1).IPAddress
    if ($ip) {
        Write-Host "OK -> $ip" -ForegroundColor Green
    } else {
        Write-Host "ECHEC (pas d'enregistrement A)" -ForegroundColor Red
    }
} catch {
    Write-Host "ECHEC ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host -NoNewline "HTTPS frontend... "
try {
    $resp = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 15
    if ($resp.StatusCode -eq 200) {
        Write-Host "OK ($($resp.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "ECHEC ($($resp.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "ECHEC ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host -NoNewline "API health... "
try {
    $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 15
    if ($health.status -eq "ok") {
        Write-Host "OK -> $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
        exit 0
    }
    Write-Host "ECHEC (status != ok)" -ForegroundColor Red
    exit 1
} catch {
    Write-Host "ECHEC ($($_.Exception.Message))" -ForegroundColor Red
    exit 1
}
