# 简化的 Demo 测试脚本
$ErrorActionPreference = "Continue"

$demos = @("vue3-demo", "react-demo", "angular-demo")
$results = @()

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试 Demo 项目启动" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($demo in $demos) {
    $demoPath = Join-Path $PSScriptRoot "examples" $demo
    
    if (-not (Test-Path $demoPath)) {
        Write-Host "跳过: $demo (目录不存在)`n" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "测试: $demo" -ForegroundColor Green
    
    # 启动开发服务器
    Push-Location $demoPath
    $process = Start-Process -FilePath "pnpm" -ArgumentList "dev" -PassThru -NoNewWindow -RedirectStandardOutput "nul" -RedirectStandardError "nul"
    Pop-Location
    
    Write-Host "  等待启动..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # 测试访问
    $url = "http://localhost:3000"
    $success = $false
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  [SUCCESS] 成功! ($url)" -ForegroundColor Green
            $success = $true
        }
    } catch {
        Write-Host "  [FAILED] 失败: 无法访问" -ForegroundColor Red
    }
    
    # 停止服务器
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    # 清理残留进程
    Get-Process -Name "node" -ErrorAction SilentlyContinue | 
        Where-Object { $_.Id -ne $PID } | 
        ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    
    Start-Sleep -Seconds 3
    Write-Host ""
    
    $results += [PSCustomObject]@{
        Demo = $demo
        Status = if ($success) { "SUCCESS" } else { "FAILED" }
        URL = $url
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试结果" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$results | Format-Table -AutoSize

$successCount = ($results | Where-Object { $_.Status -eq "SUCCESS" }).Count
$resultColor = if ($successCount -eq $results.Count) { "Green" } else { "Yellow" }
Write-Host "总计: $successCount / $($results.Count) 成功`n" -ForegroundColor $resultColor
