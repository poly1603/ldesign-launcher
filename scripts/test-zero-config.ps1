# @ldesign/launcher 零配置功能测试脚本 (PowerShell)
# 用于验证各框架的自动检测和零配置启动功能

# 测试结果统计
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

# 打印带颜色的消息
function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
}

# 测试框架检测
function Test-FrameworkDetection {
    param(
        [string]$Framework,
        [string]$TestDir
    )
    
    $script:TotalTests++
    
    Print-Info "测试 $Framework 框架检测..."
    
    if (-not (Test-Path $TestDir)) {
        Print-Warning "测试目录不存在: $TestDir"
        Print-Warning "跳过 $Framework 测试"
        return
    }
    
    Push-Location $TestDir
    
    try {
        # 运行框架检测
        $output = npx launcher dev --dry-run 2>&1 | Out-String
        
        if ($output -match $Framework) {
            Print-Success "$Framework 框架检测成功"
            $script:PassedTests++
        } else {
            Print-Error "$Framework 框架检测失败"
            $script:FailedTests++
        }
    } catch {
        Print-Error "$Framework 框架检测失败: $_"
        $script:FailedTests++
    } finally {
        Pop-Location
    }
}

# 测试零配置启动
function Test-ZeroConfigStart {
    param(
        [string]$Framework,
        [string]$TestDir
    )
    
    $script:TotalTests++
    
    Print-Info "测试 $Framework 零配置启动..."
    
    if (-not (Test-Path $TestDir)) {
        Print-Warning "测试目录不存在: $TestDir"
        Print-Warning "跳过 $Framework 测试"
        return
    }
    
    Push-Location $TestDir
    
    try {
        # 检查是否有配置文件
        if ((Test-Path "launcher.config.ts") -or (Test-Path "launcher.config.js")) {
            Print-Warning "$Framework 项目存在配置文件，不是纯零配置"
        }
        
        # 尝试启动（后台进程）
        $job = Start-Job -ScriptBlock {
            param($dir)
            Set-Location $dir
            npx launcher dev --no-open
        } -ArgumentList (Get-Location).Path
        
        Start-Sleep -Seconds 3
        
        # 检查进程是否还在运行
        if ($job.State -eq "Running") {
            Print-Success "$Framework 零配置启动成功"
            $script:PassedTests++
            Stop-Job $job
            Remove-Job $job
        } else {
            Print-Error "$Framework 零配置启动失败"
            $script:FailedTests++
            Remove-Job $job
        }
    } catch {
        Print-Error "$Framework 零配置启动失败: $_"
        $script:FailedTests++
    } finally {
        Pop-Location
    }
}

# 测试构建功能
function Test-Build {
    param(
        [string]$Framework,
        [string]$TestDir
    )
    
    $script:TotalTests++
    
    Print-Info "测试 $Framework 构建功能..."
    
    if (-not (Test-Path $TestDir)) {
        Print-Warning "测试目录不存在: $TestDir"
        Print-Warning "跳过 $Framework 测试"
        return
    }
    
    Push-Location $TestDir
    
    try {
        # 运行构建
        npx launcher build 2>&1 | Out-Null
        
        # 检查构建产物
        if ((Test-Path "dist") -or (Test-Path "build")) {
            Print-Success "$Framework 构建成功"
            $script:PassedTests++
        } else {
            Print-Error "$Framework 构建失败：未找到构建产物"
            $script:FailedTests++
        }
    } catch {
        Print-Error "$Framework 构建失败: $_"
        $script:FailedTests++
    } finally {
        Pop-Location
    }
}

# 主测试流程
function Main {
    Print-Header "🧪 @ldesign/launcher 零配置功能测试"
    
    Print-Info "开始测试..."
    Write-Host ""
    
    # 定义测试项目路径（根据实际情况调整）
    $ExamplesDir = "..\..\examples"
    
    # 测试各框架
    Print-Header "📋 框架检测测试"
    
    Test-FrameworkDetection "React" "$ExamplesDir\react-demo"
    Test-FrameworkDetection "Vue 3" "$ExamplesDir\vue3-demo"
    Test-FrameworkDetection "Svelte" "$ExamplesDir\svelte-demo"
    Test-FrameworkDetection "Solid" "$ExamplesDir\solid-demo"
    Test-FrameworkDetection "Preact" "$ExamplesDir\preact-demo"
    Test-FrameworkDetection "Qwik" "$ExamplesDir\qwik-demo"
    Test-FrameworkDetection "Lit" "$ExamplesDir\lit-demo"
    Test-FrameworkDetection "Angular" "$ExamplesDir\angular-demo"
    Test-FrameworkDetection "Marko" "$ExamplesDir\marko-demo"
    
    Print-Header "🚀 零配置启动测试"
    
    Test-ZeroConfigStart "React" "$ExamplesDir\react-demo"
    Test-ZeroConfigStart "Vue 3" "$ExamplesDir\vue3-demo"
    Test-ZeroConfigStart "Svelte" "$ExamplesDir\svelte-demo"
    
    Print-Header "🏗️ 构建功能测试"
    
    Test-Build "React" "$ExamplesDir\react-demo"
    Test-Build "Vue 3" "$ExamplesDir\vue3-demo"
    
    # 打印测试结果
    Print-Header "📊 测试结果"
    
    Write-Host "总测试数: $script:TotalTests"
    Write-Host "通过: $script:PassedTests" -ForegroundColor Green
    Write-Host "失败: $script:FailedTests" -ForegroundColor Red
    Write-Host ""
    
    if ($script:FailedTests -eq 0) {
        Print-Success "所有测试通过！🎉"
        exit 0
    } else {
        Print-Error "部分测试失败"
        exit 1
    }
}

# 运行主函数
Main


