# Test script for all example projects
# Tests: dev server, build, preview

$ErrorActionPreference = "Continue"
$baseDir = "D:\WorkBench\ldesign\tools\launcher\examples"

# Define all projects with their ports
$projects = @(
    @{Name="react-demo"; Port=3000},
    @{Name="vue3-demo"; Port=3000},
    @{Name="vue2-demo"; Port=3000},
    @{Name="solid-demo"; Port=3000},
    @{Name="lit-demo"; Port=3000},
    @{Name="preact-demo"; Port=3000},
    @{Name="angular-demo"; Port=4200},
    @{Name="svelte-demo"; Port=5173},
    @{Name="qwik-demo"; Port=5173}
)

$results = @()

foreach ($project in $projects) {
    $projectName = $project.Name
    $port = $project.Port
    $projectPath = Join-Path $baseDir $projectName
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Testing: $projectName" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $result = @{
        Project = $projectName
        Port = $port
        DevServerStarted = $false
        DevServerAccessible = $false
        BuildSuccess = $false
        PreviewStarted = $false
        PreviewAccessible = $false
        Errors = @()
    }
    
    # Test 1: Dev Server
    Write-Host "Testing dev server..." -ForegroundColor Yellow
    
    $job = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        pnpm run dev 2>&1
    } -ArgumentList $projectPath
    
    Start-Sleep -Seconds 8
    
    # Check if port is listening
    $listening = netstat -ano | Select-String ":$port.*LISTENING"
    if ($listening) {
        $result.DevServerStarted = $true
        Write-Host "✓ Dev server started on port $port" -ForegroundColor Green
        
        # Try to access via HTTP
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $result.DevServerAccessible = $true
                Write-Host "✓ Dev server is accessible" -ForegroundColor Green
            }
        } catch {
            $result.Errors += "Dev server not accessible: $($_.Exception.Message)"
            Write-Host "✗ Dev server not accessible" -ForegroundColor Red
        }
    } else {
        $result.Errors += "Dev server did not start"
        Write-Host "✗ Dev server did not start" -ForegroundColor Red
    }
    
    # Stop dev server
    Stop-Job -Job $job
    Remove-Job -Job $job
    Start-Sleep -Seconds 2
    
    # Test 2: Build
    Write-Host "`nTesting build..." -ForegroundColor Yellow
    
    try {
        Set-Location $projectPath
        $buildOutput = pnpm run build 2>&1
        $buildSuccess = $LASTEXITCODE -eq 0
        
        if ($buildSuccess -and (Test-Path (Join-Path $projectPath "dist"))) {
            $result.BuildSuccess = $true
            Write-Host "✓ Build successful" -ForegroundColor Green
        } else {
            $result.Errors += "Build failed"
            Write-Host "✗ Build failed" -ForegroundColor Red
        }
    } catch {
        $result.Errors += "Build error: $($_.Exception.Message)"
        Write-Host "✗ Build error" -ForegroundColor Red
    }
    
    # Test 3: Preview (only if build succeeded)
    if ($result.BuildSuccess) {
        Write-Host "`nTesting preview..." -ForegroundColor Yellow
        
        $previewPort = 4173
        $previewJob = Start-Job -ScriptBlock {
            param($path)
            Set-Location $path
            pnpm run preview 2>&1
        } -ArgumentList $projectPath
        
        Start-Sleep -Seconds 5
        
        # Check if preview port is listening
        $previewListening = netstat -ano | Select-String ":$previewPort.*LISTENING"
        if ($previewListening) {
            $result.PreviewStarted = $true
            Write-Host "✓ Preview server started on port $previewPort" -ForegroundColor Green
            
            # Try to access preview
            try {
                $previewResponse = Invoke-WebRequest -Uri "http://localhost:$previewPort" -TimeoutSec 5 -UseBasicParsing
                if ($previewResponse.StatusCode -eq 200) {
                    $result.PreviewAccessible = $true
                    Write-Host "✓ Preview server is accessible" -ForegroundColor Green
                }
            } catch {
                $result.Errors += "Preview server not accessible: $($_.Exception.Message)"
                Write-Host "✗ Preview server not accessible" -ForegroundColor Red
            }
        } else {
            $result.Errors += "Preview server did not start"
            Write-Host "✗ Preview server did not start" -ForegroundColor Red
        }
        
        # Stop preview server
        Stop-Job -Job $previewJob
        Remove-Job -Job $previewJob
        Start-Sleep -Seconds 2
    }
    
    $results += $result
}

# Summary
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($result in $results) {
    $passed = $result.DevServerStarted -and $result.DevServerAccessible -and $result.BuildSuccess
    $status = if ($passed) { "✓ PASS" } else { "✗ FAIL" }
    $color = if ($passed) { "Green" } else { "Red" }
    
    Write-Host "$status - $($result.Project)" -ForegroundColor $color
    Write-Host "  Dev Server: $(if ($result.DevServerAccessible) {'✓'} else {'✗'})" -ForegroundColor $(if ($result.DevServerAccessible) {'Green'} else {'Red'})
    Write-Host "  Build: $(if ($result.BuildSuccess) {'✓'} else {'✗'})" -ForegroundColor $(if ($result.BuildSuccess) {'Green'} else {'Red'})
    Write-Host "  Preview: $(if ($result.PreviewAccessible) {'✓'} else {'✗'})" -ForegroundColor $(if ($result.PreviewAccessible) {'Green'} else {'Red'})
    
    if ($result.Errors.Count -gt 0) {
        Write-Host "  Errors:" -ForegroundColor Yellow
        foreach ($error in $result.Errors) {
            Write-Host "    - $error" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

$totalPassed = ($results | Where-Object { $_.DevServerAccessible -and $_.BuildSuccess }).Count
$totalProjects = $results.Count

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total: $totalPassed / $totalProjects projects passed" -ForegroundColor $(if ($totalPassed -eq $totalProjects) {'Green'} else {'Yellow'})
Write-Host "========================================`n" -ForegroundColor Cyan
