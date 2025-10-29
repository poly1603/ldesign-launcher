# 测试所有示例项目
# 此脚本会逐个启动示例项目，检查能否正常启动

$ErrorActionPreference = "Continue"
$examplesDir = "examples"
$testResults = @()

# 获取所有示例项目
$examples = Get-ChildItem -Path $examplesDir -Directory | Select-Object -ExpandProperty Name

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始测试 $($examples.Count) 个示例项目" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($example in $examples) {
    Write-Host "`n>>> 测试项目: $example" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    
    $examplePath = Join-Path $examplesDir $example
    $result = @{
        Name = $example
        Status = "未知"
        Port = 0
        Error = $null
    }
    
    Push-Location $examplePath
    
    try {
        # 检查package.json是否存在
        if (-not (Test-Path "package.json")) {
            Write-Host "❌ 缺少 package.json" -ForegroundColor Red
            $result.Status = "失败"
            $result.Error = "缺少 package.json"
            $testResults += $result
            Pop-Location
            continue
        }
        
        # 检查node_modules
        if (-not (Test-Path "node_modules")) {
            Write-Host "⚠️  未安装依赖，正在安装..." -ForegroundColor Yellow
            npm install --silent 2>&1 | Out-Null
        }
        
        # 读取配置文件获取端口
        $port = 3000
        if (Test-Path "launcher.config.ts") {
            $config = Get-Content "launcher.config.ts" -Raw
            if ($config -match "port:\s*(\d+)") {
                $port = [int]$Matches[1]
            }
        }
        $result.Port = $port
        
        Write-Host "📦 启动项目 (端口: $port)..." -ForegroundColor Cyan
        
        # 启动开发服务器（后台）
        $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\launcher-test-$example.log" -RedirectStandardError "$env:TEMP\launcher-test-$example-error.log"
        
        # 等待服务器启动
        Write-Host "⏳ 等待服务器启动..." -ForegroundColor Gray
        $maxWait = 30
        $waited = 0
        $started = $false
        
        while ($waited -lt $maxWait) {
            Start-Sleep -Seconds 1
            $waited++
            
            # 检查端口是否监听
            try {
                $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
                if ($connection) {
                    $started = $true
                    break
                }
            } catch {
                # 继续等待
            }
            
            # 检查进程是否还在运行
            if ($process.HasExited) {
                Write-Host "❌ 进程异常退出" -ForegroundColor Red
                $result.Status = "失败"
                $result.Error = "进程异常退出"
                break
            }
        }
        
        if ($started) {
            Write-Host "✅ 服务器启动成功！" -ForegroundColor Green
            Write-Host "🌐 访问地址: http://localhost:$port" -ForegroundColor Green
            
            # 尝试访问页面
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 5 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ 页面访问成功 (HTTP $($response.StatusCode))" -ForegroundColor Green
                    $result.Status = "成功"
                } else {
                    Write-Host "⚠️  页面响应异常 (HTTP $($response.StatusCode))" -ForegroundColor Yellow
                    $result.Status = "警告"
                    $result.Error = "HTTP $($response.StatusCode)"
                }
            } catch {
                Write-Host "⚠️  页面访问失败: $($_.Exception.Message)" -ForegroundColor Yellow
                $result.Status = "警告"
                $result.Error = "页面访问失败"
            }
            
            # 停止服务器
            Write-Host "🛑 停止服务器..." -ForegroundColor Gray
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            
            # 等待端口释放
            Start-Sleep -Seconds 2
        } else {
            Write-Host "❌ 服务器启动超时 (等待 ${waited}s)" -ForegroundColor Red
            $result.Status = "失败"
            $result.Error = "启动超时"
            
            # 停止进程
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
        
    } catch {
        Write-Host "❌ 测试失败: $($_.Exception.Message)" -ForegroundColor Red
        $result.Status = "失败"
        $result.Error = $_.Exception.Message
    } finally {
        Pop-Location
    }
    
    $testResults += $result
}

# 输出测试报告
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试报告" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Status -eq "成功" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "失败" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "警告" }).Count

Write-Host "总计: $($testResults.Count) 个项目" -ForegroundColor White
Write-Host "成功: $successCount" -ForegroundColor Green
Write-Host "警告: $warnCount" -ForegroundColor Yellow
Write-Host "失败: $failCount`n" -ForegroundColor Red

# 详细结果
$testResults | ForEach-Object {
    $color = switch ($_.Status) {
        "成功" { "Green" }
        "警告" { "Yellow" }
        "失败" { "Red" }
        default { "Gray" }
    }
    
    $statusIcon = switch ($_.Status) {
        "成功" { "✅" }
        "警告" { "⚠️" }
        "失败" { "❌" }
        default { "❓" }
    }
    
    Write-Host "$statusIcon $($_.Name.PadRight(20)) [$($_.Status)]" -ForegroundColor $color -NoNewline
    
    if ($_.Port -gt 0) {
        Write-Host " (端口: $($_.Port))" -ForegroundColor Gray -NoNewline
    }
    
    if ($_.Error) {
        Write-Host " - $($_.Error)" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan

# 返回退出码
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
