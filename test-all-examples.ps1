# 测试所有示例项目
$examples = @(
    "react-demo",
    "vue3-demo", 
    "vue2-demo",
    "svelte-demo",
    "solid-demo",
    "lit-demo",
    "preact-demo",
    "qwik-demo"
)

$results = @()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  测试所有示例项目构建" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($example in $examples) {
    Write-Host "[$example] 开始测试..." -ForegroundColor Yellow
    
    $examplePath = "D:\WorkBench\ldesign\tools\launcher\examples\$example"
    Push-Location $examplePath
    
    try {
        $output = npm run build 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0 -and $output -match "构建成功|Build success|built in") {
            Write-Host "[$example] ✅ 成功" -ForegroundColor Green
            $results += [PSCustomObject]@{
                Project = $example
                Status = "✅ 成功"
                Result = "通过"
            }
        } else {
            Write-Host "[$example] ❌ 失败" -ForegroundColor Red
            $results += [PSCustomObject]@{
                Project = $example
                Status = "❌ 失败"
                Result = "失败"
            }
        }
    }
    catch {
        Write-Host "[$example] ❌ 异常: $_" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Project = $example
            Status = "❌ 异常"
            Result = "异常"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  测试结果汇总" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$successCount = ($results | Where-Object { $_.Result -eq "通过" }).Count
$totalCount = $results.Count

Write-Host ""
Write-Host "成功: $successCount/$totalCount" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
