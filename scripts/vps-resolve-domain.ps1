# Choisit le domaine de deploiement : medicare-tchad.com si DNS OK, sinon sslip.io.
param(
    [string]$PreferredDomain = "medicare-tchad.com",
    [string]$VpsHost = ""
)

function Get-VpsHostFromKnownHosts {
    $knownHosts = Join-Path $env:USERPROFILE ".ssh\known_hosts"
    if (-not (Test-Path $knownHosts)) { return "" }
    $line = Get-Content $knownHosts | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+' } | Select-Object -First 1
    if ($line -match '^(\d+\.\d+\.\d+\.\d+)') { return $matches[1] }
    return ""
}

function Test-DomainPointsToVps {
    param([string]$Domain, [string]$ExpectedIp)
    try {
        $dns = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop
        $ip = ($dns | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1).IPAddress
        return ($ip -eq $ExpectedIp)
    } catch {
        return $false
    }
}

if (-not $VpsHost) { $VpsHost = Get-VpsHostFromKnownHosts }

if (-not $VpsHost) {
    Write-Output $PreferredDomain
    exit 0
}

if (Test-DomainPointsToVps -Domain $PreferredDomain -ExpectedIp $VpsHost) {
    Write-Output $PreferredDomain
    exit 0
}

$sslip = ($VpsHost -replace '\.', '-') + ".sslip.io"
if (Test-DomainPointsToVps -Domain $sslip -ExpectedIp $VpsHost) {
    [Console]::Error.WriteLine("DNS $PreferredDomain indisponible - utilisation de $sslip")
    Write-Output $sslip
    exit 0
}

[Console]::Error.WriteLine("Aucun DNS valide - utilisation de $sslip (temporaire)")
Write-Output $sslip
