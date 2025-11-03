# 测试所有示例项目是否能正常启动
# Author: LDesign Team
# Date: 2025-11-03

$ErrorActionPreference = "Continue"
$projects = @("react-demo", "vue3-demo", "vue2-demo", "svelte-demo", "solid-demo", "preact-demo", "qwik-demo", "lit-demo")
$results = @()
$port = 3010

Write-Host "🚀 开始测试 launcher 示例项目..." -ForegroundColor Cyan
Write-Host ""

foreach ($project in $projects) {
    $projectPath = "D:\WorkBench\ldesign\tools\launcher\examples\$project"
    
    if (!(Test-Path $projectPath)) {
        Write-Host "⚠️  项目不存在: $project" -ForegroundColor Yellow
        $results += [PSCustomObject]@{
            Project = $project
            Status = "不存在"
            Port = "-"
            Time = 0
        }
        continue
    }
    
    Write-Host "测试项目: $project (端口: $port)" -ForegroundColor Green
    $startTime = Get-Date
    
    try {
        # 启动开发服务器
        $job = Start-Job -ScriptBlock {
            param($path, $p)
            Set-Location $path
            & node "../../bin/launcher.js" dev --port $p 2>&1
        } -ArgumentList $projectPath, $port
        
        # 等待 8 秒让服务器启动
        Start-Sleep -Seconds 8
        
        # 检查端口是否打开
        $portOpen = $false
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.Connect("localhost", $port)
            $portOpen = $true
            $tcpClient.Close()
        } catch {
            $portOpen = $false
        }
        
        # 停止 Job
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -Force -ErrorAction SilentlyContinue
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($portOpen) {
            Write-Host "  ✅ 启动成功 ($([math]::Round($duration, 2))秒)" -ForegroundColor Green
            $status = "成功"
        } else {
            Write-Host "  ❌ 启动失败 - 端口未打开" -ForegroundColor Red
            $status = "失败"
        }
        
        $results += [PSCustomObject]@{
            Project = $project
            Status = $status
            Port = $port
            Time = [math]::Round($duration, 2)
        }
        
    } catch {
        Write-Host "  ❌ 测试出错: $_" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Project = $project
            Status = "错误"
            Port = $port
            Time = 0
        }
    }
    
    $port++
    Start-Sleep -Seconds 2
    Write-Host ""
}

# 显示结果汇总
Write-Host ""
Write-Host "📊 测试结果汇总" -ForegroundColor Cyan
Write-Host "=" * 60
$results | Format-Table -AutoSize

$successCount = ($results | Where-Object { $_.Status -eq "成功" }).Count
$totalCount = $results.Count

Write-Host ""
Write-Host "✨ 完成! 成功: $successCount/$totalCount" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

# 导出结果到文件
$results | ConvertTo-Json | Out-File "examples-test-results.json"
Write-Host "📁 结果已保存到: examples-test-results.json" -ForegroundColor Gray
