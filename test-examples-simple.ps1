# Test all example projects
$ErrorActionPreference = "Continue"
$examplesDir = "examples"
$testResults = @()

# Get all example projects
$examples = Get-ChildItem -Path $examplesDir -Directory | Select-Object -ExpandProperty Name

Write-Host "========================================"
Write-Host "Testing $($examples.Count) example projects"
Write-Host "========================================`n"

foreach ($example in $examples) {
    Write-Host "`n>>> Testing: $example"
    Write-Host "----------------------------------------"
    
    $examplePath = Join-Path $examplesDir $example
    $result = @{
        Name = $example
        Status = "Unknown"
        Port = 0
        Error = $null
    }
    
    Push-Location $examplePath
    
    try {
        # Check package.json
        if (-not (Test-Path "package.json")) {
            Write-Host "[FAIL] Missing package.json"
            $result.Status = "Failed"
            $result.Error = "Missing package.json"
            $testResults += $result
            Pop-Location
            continue
        }
        
        # Check node_modules
        if (-not (Test-Path "node_modules")) {
            Write-Host "[WARN] Installing dependencies..."
            npm install --silent 2>&1 | Out-Null
        }
        
        # Get port from config
        $port = 3000
        if (Test-Path "launcher.config.ts") {
            $config = Get-Content "launcher.config.ts" -Raw
            if ($config -match "port:\s*(\d+)") {
                $port = [int]$Matches[1]
            }
        }
        $result.Port = $port
        
        Write-Host "[INFO] Starting server (port: $port)..."
        
        # Start dev server in background
        $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\launcher-test-$example.log" -RedirectStandardError "$env:TEMP\launcher-test-$example-error.log"
        
        # Wait for server to start
        Write-Host "[INFO] Waiting for server..."
        $maxWait = 30
        $waited = 0
        $started = $false
        
        while ($waited -lt $maxWait) {
            Start-Sleep -Seconds 1
            $waited++
            
            # Check if port is listening
            try {
                $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
                if ($connection) {
                    $started = $true
                    break
                }
            } catch {
                # Continue waiting
            }
            
            # Check if process still running
            if ($process.HasExited) {
                Write-Host "[FAIL] Process exited unexpectedly"
                $result.Status = "Failed"
                $result.Error = "Process exited"
                break
            }
        }
        
        if ($started) {
            Write-Host "[SUCCESS] Server started!"
            Write-Host "[INFO] URL: http://localhost:$port"
            
            # Try to access the page
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 5 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Host "[SUCCESS] Page accessible (HTTP $($response.StatusCode))"
                    $result.Status = "Success"
                } else {
                    Write-Host "[WARN] Unexpected response (HTTP $($response.StatusCode))"
                    $result.Status = "Warning"
                    $result.Error = "HTTP $($response.StatusCode)"
                }
            } catch {
                Write-Host "[WARN] Page access failed: $($_.Exception.Message)"
                $result.Status = "Warning"
                $result.Error = "Page access failed"
            }
            
            # Stop server
            Write-Host "[INFO] Stopping server..."
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            
            # Wait for port to be released
            Start-Sleep -Seconds 2
        } else {
            Write-Host "[FAIL] Server start timeout (waited ${waited}s)"
            $result.Status = "Failed"
            $result.Error = "Start timeout"
            
            # Stop process
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
        
    } catch {
        Write-Host "[FAIL] Test failed: $($_.Exception.Message)"
        $result.Status = "Failed"
        $result.Error = $_.Exception.Message
    } finally {
        Pop-Location
    }
    
    $testResults += $result
}

# Output test report
Write-Host "`n========================================"
Write-Host "Test Report"
Write-Host "========================================`n"

$successCount = ($testResults | Where-Object { $_.Status -eq "Success" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "Failed" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "Warning" }).Count

Write-Host "Total: $($testResults.Count) projects"
Write-Host "Success: $successCount"
Write-Host "Warning: $warnCount"
Write-Host "Failed: $failCount`n"

# Detailed results
$testResults | ForEach-Object {
    $status = $_.Status.PadRight(10)
    $name = $_.Name.PadRight(20)
    Write-Host "[$status] $name (Port: $($_.Port))" -NoNewline
    
    if ($_.Error) {
        Write-Host " - $($_.Error)"
    } else {
        Write-Host ""
    }
}

Write-Host "`n========================================"

# Return exit code
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
