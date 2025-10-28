# 测试所有 demo 项目的启动脚本
# 
# 此脚本会启动每个 demo 项目，等待服务器就绪，然后测试是否可以访问

$ErrorActionPreference = "Stop"

# demo 列表
$demos = @(
    "vue3-demo",
    "react-demo",
    "vue2-demo",
    "angular-demo",
    "solid-demo",
    "svelte-demo",
    "preact-demo",
    "qwik-demo",
    "lit-demo"
)

$results = @()
$scriptDir = $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "开始测试所有 Demo 项目" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($demo in $demos) {
    $demoPath = Join-Path $scriptDir "examples" $demo
    
    if (-not (Test-Path $demoPath)) {
        Write-Host "⚠️  跳过: $demo (目录不存在)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "📦 测试: $demo" -ForegroundColor Green
    Write-Host "   路径: $demoPath" -ForegroundColor Gray
    
    try {
        # 启动开发服务器（后台运行）
        Push-Location $demoPath
        $process = Start-Process -FilePath "pnpm" -ArgumentList "dev" -PassThru -NoNewWindow
        Pop-Location
        
        Write-Host "   等待服务器启动..." -ForegroundColor Gray
        Start-Sleep -Seconds 8
        
        # 测试服务器是否可访问
        $port = 3000
        $url = "http://localhost:$port"
        
        $response = $null
        $testFailed = $false
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
        } catch {
            $testFailed = $true
            Write-Host "   ❌ 失败: 无法连接到服务器" -ForegroundColor Red
            Write-Host "   错误: $($_.Exception.Message)`n" -ForegroundColor Red
            
            $results += [PSCustomObject]@{
                Demo = $demo
                Status = "❌ 失败"
                URL = $url
                StatusCode = "N/A"
            }
        }
        
        if (-not $testFailed) {
            if ($response.StatusCode -eq 200) {
                Write-Host "   ✅ 成功! 服务器响应正常 (200 OK)" -ForegroundColor Green
                Write-Host "   🌐 URL: $url`n" -ForegroundColor Cyan
                
                $results += [PSCustomObject]@{
                    Demo = $demo
                    Status = "✅ 成功"
                    URL = $url
                    StatusCode = $response.StatusCode
                }
            } else {
                Write-Host "   ⚠️  警告: 服务器响应异常 ($($response.StatusCode))`n" -ForegroundColor Yellow
                
                $results += [PSCustomObject]@{
                    Demo = $demo
                    Status = "⚠️ 警告"
                    URL = $url
                    StatusCode = $response.StatusCode
                }
            }
        }
        
        # 停止服务器
        if ($process -and -not $process.HasExited) {
            Write-Host "   停止服务器..." -ForegroundColor Gray
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            
            # 等待进程完全退出
            Start-Sleep -Seconds 2
            
            # 清理可能残留的 node 进程（占用 3000 端口）
            $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
                $_.Id -ne $PID
            }
            foreach ($p in $nodeProcesses) {
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            }
        }
        
        # 等待端口释放
        Start-Sleep -Seconds 3
        
    } catch {
        Write-Host "   ❌ 错误: $($_.Exception.Message)`n" -ForegroundColor Red
        
        $results += [PSCustomObject]@{
            Demo = $demo
            Status = "❌ 错误"
            URL = "N/A"
            StatusCode = "N/A"
        }
        
        # 尝试清理
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

# 输出测试摘要
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试摘要" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$results | Format-Table -AutoSize

$successCount = ($results | Where-Object { $_.Status -eq "✅ 成功" }).Count
$totalCount = $results.Count

Write-Host "`n总计: $successCount / $totalCount 成功`n" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

# 返回退出码
if ($successCount -eq $totalCount) {
    exit 0
} else {
    exit 1
}

