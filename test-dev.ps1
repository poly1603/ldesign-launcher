param(
    [string]$ProjectPath,
    [int]$Port = 3000
)

Write-Host "Starting dev server for: $ProjectPath on port $Port"

# Start the dev server in background
$job = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    pnpm run dev
} -ArgumentList $ProjectPath

Write-Host "Dev server job started with ID: $($job.Id)"
Write-Host "Waiting for server to be ready..."

# Wait for port to be listening
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 2
    $attempt++
    
    $connections = netstat -ano | Select-String ":$Port"
    if ($connections) {
        Write-Host "Server is ready on port $Port"
        $serverReady = $true
    } else {
        Write-Host "Attempt $attempt/$maxAttempts - Waiting for server..."
    }
}

if ($serverReady) {
    Write-Host "SUCCESS: Dev server is running on http://localhost:$Port"
    return @{
        Success = $true
        JobId = $job.Id
        Port = $Port
    }
} else {
    Write-Host "FAILED: Server did not start within timeout"
    Stop-Job -Id $job.Id
    Remove-Job -Id $job.Id
    return @{
        Success = $false
        JobId = $null
        Port = $Port
    }
}
