param(
  [string]$UserName = "Kenneth Fischer",
  [string]$ApiBase = "http://localhost:3001"
)

$ErrorActionPreference = "Stop"

Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not $token -or [string]::IsNullOrWhiteSpace($token)) {
  throw "`$token is not set in this terminal. In the same terminal where token exists, run: .\\scripts\\run-opportunity-diag.ps1"
}

$outLog = ".\\api-diagnostics.out.log"
$errLog = ".\\api-diagnostics.err.log"

if (Test-Path $outLog) { Remove-Item $outLog -Force }
if (Test-Path $errLog) { Remove-Item $errLog -Force }

$apiProc = Start-Process -FilePath node -ArgumentList "server.js" -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog

try {
  $ready = $false
  for ($i = 0; $i -lt 80; $i++) {
    try {
      $health = Invoke-RestMethod -Method Get -Uri "$ApiBase/api/health" -TimeoutSec 2
      if ($health.status -eq "OK") {
        $ready = $true
        break
      }
    } catch {
      # retry until loop exits
    }
  }

  if (-not $ready) {
    throw "API did not become ready at $ApiBase/api/health"
  }

  $headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  }

  $body = @{
    userName = $UserName
    userAlias = ""
    userId = ""
  } | ConvertTo-Json

  $diag = Invoke-RestMethod -Method Post -Uri "$ApiBase/api/diag/opportunities" -Headers $headers -Body $body -TimeoutSec 45

  Write-Host "`n=== Diagnostic Inputs ===" -ForegroundColor Cyan
  $diag.inputs | Format-List | Out-Host

  Write-Host "`n=== Summary ===" -ForegroundColor Cyan
  $diag.summary | Format-List | Out-Host

  Write-Host "`n=== Matched Owners (Top 10) ===" -ForegroundColor Cyan
  $diag.matchedOwners | Select-Object -First 10 | Format-Table -AutoSize | Out-Host

  Write-Host "`n=== Matched Opportunities (Top 10) ===" -ForegroundColor Cyan
  $diag.matchedOpportunitySamples | Select-Object -First 10 | Format-Table -AutoSize | Out-Host

  Write-Host "`n=== Backend Log Tail (stdout) ===" -ForegroundColor Cyan
  Get-Content $outLog -Tail 120 | Out-Host

  if (Test-Path $errLog -and (Get-Item $errLog).Length -gt 0) {
    Write-Host "`n=== Backend Log Tail (stderr) ===" -ForegroundColor Yellow
    Get-Content $errLog -Tail 120 | Out-Host
  }

  Write-Host "`nDone." -ForegroundColor Green
} finally {
  if ($apiProc -and -not $apiProc.HasExited) {
    Stop-Process -Id $apiProc.Id -Force
  }
}
