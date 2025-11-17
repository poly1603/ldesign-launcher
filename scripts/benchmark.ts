/**
 * 性能基准测试脚本
 * 
 * 测量关键操作的性能指标
 */

import { PerformanceProfiler } from '../src/utils/performance-profiler'
import { ConfigManager } from '../src/core/ConfigManager'
import { PluginManager } from '../src/core/PluginManager'
import { Logger } from '../src/utils/logger'
import path from 'path'

const profiler = new PerformanceProfiler()
const logger = new Logger('Benchmark', { level: 'info' })

/**
 * 基准测试配置
 */
interface BenchmarkConfig {
  iterations: number  // 迭代次数
  warmup: number      // 预热次数
}

const defaultConfig: BenchmarkConfig = {
  iterations: 10,
  warmup: 3
}

/**
 * 测试配置加载性能
 */
async function benchmarkConfigLoading(config: BenchmarkConfig) {
  logger.info('🧪 测试配置加载性能...')
  
  const times: number[] = []
  const testConfigPath = path.resolve(process.cwd(), 'examples/react-demo/launcher.config.ts')
  
  // 预热
  for (let i = 0; i < config.warmup; i++) {
    const configManager = new ConfigManager({
      configFile: testConfigPath,
      watch: false
    })
    await configManager.load()
  }
  
  // 正式测试
  for (let i = 0; i < config.iterations; i++) {
    const start = Date.now()
    
    const configManager = new ConfigManager({
      configFile: testConfigPath,
      watch: false
    })
    await configManager.load()
    
    const duration = Date.now() - start
    times.push(duration)
  }
  
  return calculateStats(times, '配置加载')
}

/**
 * 测试框架检测性能
 */
async function benchmarkFrameworkDetection(config: BenchmarkConfig) {
  logger.info('🧪 测试框架检测性能...')
  
  const times: number[] = []
  const testCwd = path.resolve(process.cwd(), 'examples/react-demo')
  
  // 预热
  for (let i = 0; i < config.warmup; i++) {
    const pluginManager = new PluginManager(testCwd, logger)
    await pluginManager.getRecommendedPlugins()
  }
  
  // 正式测试
  for (let i = 0; i < config.iterations; i++) {
    const start = Date.now()
    
    const pluginManager = new PluginManager(testCwd, logger)
    await pluginManager.getRecommendedPlugins()
    
    const duration = Date.now() - start
    times.push(duration)
  }
  
  return calculateStats(times, '框架检测')
}

/**
 * 计算统计数据
 */
function calculateStats(times: number[], name: string) {
  const sorted = times.slice().sort((a, b) => a - b)
  const avg = times.reduce((sum, t) => sum + t, 0) / times.length
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const median = sorted[Math.floor(sorted.length / 2)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const p99 = sorted[Math.floor(sorted.length * 0.99)]
  
  return {
    name,
    iterations: times.length,
    avg: Math.round(avg * 100) / 100,
    min,
    max,
    median,
    p95,
    p99,
    stdDev: calculateStdDev(times, avg)
  }
}

/**
 * 计算标准差
 */
function calculateStdDev(times: number[], avg: number): number {
  const squareDiffs = times.map(t => Math.pow(t - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, d) => sum + d, 0) / times.length
  return Math.round(Math.sqrt(avgSquareDiff) * 100) / 100
}

/**
 * 打印统计结果
 */
function printStats(stats: ReturnType<typeof calculateStats>) {
  console.log(`\n📊 ${stats.name} 性能统计 (${stats.iterations} 次迭代)`)
  console.log('━'.repeat(60))
  console.log(`  平均值:     ${stats.avg}ms`)
  console.log(`  最小值:     ${stats.min}ms`)
  console.log(`  最大值:     ${stats.max}ms`)
  console.log(`  中位数:     ${stats.median}ms`)
  console.log(`  P95:       ${stats.p95}ms`)
  console.log(`  P99:       ${stats.p99}ms`)
  console.log(`  标准差:     ${stats.stdDev}ms`)
  console.log('━'.repeat(60))
}

/**
 * 生成性能报告
 */
function generateReport(results: Array<ReturnType<typeof calculateStats>>) {
  console.log('\n' + '='.repeat(60))
  console.log('📈 性能基准测试报告')
  console.log('='.repeat(60))
  
  console.log('\n总览:')
  console.log('┌─────────────────────┬──────────┬──────────┬──────────┐')
  console.log('│ 测试项目            │ 平均值   │ 中位数   │ P95      │')
  console.log('├─────────────────────┼──────────┼──────────┼──────────┤')
  
  for (const result of results) {
    const name = result.name.padEnd(20)
    const avg = `${result.avg}ms`.padStart(8)
    const median = `${result.median}ms`.padStart(8)
    const p95 = `${result.p95}ms`.padStart(8)
    console.log(`│ ${name}│ ${avg} │ ${median} │ ${p95} │`)
  }
  
  console.log('└─────────────────────┴──────────┴──────────┴──────────┘')
  
  // 对比优化目标
  console.log('\n🎯 优化目标对比:')
  const configResult = results.find(r => r.name === '配置加载')
  if (configResult) {
    const target = 10
    const status = configResult.avg <= target ? '✅ 达成' : '⚠️  未达成'
    console.log(`  配置加载: ${configResult.avg}ms / 目标 ${target}ms ${status}`)
    if (configResult.avg <= target) {
      const improvement = Math.round((200 - configResult.avg) / 200 * 100)
      console.log(`  相比优化前(200ms)提升 ${improvement}%`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 启动性能基准测试...\n')
  
  const config = defaultConfig
  const results: Array<ReturnType<typeof calculateStats>> = []
  
  try {
    // 测试配置加载
    const configStats = await benchmarkConfigLoading(config)
    printStats(configStats)
    results.push(configStats)
    
    // 测试框架检测
    const frameworkStats = await benchmarkFrameworkDetection(config)
    printStats(frameworkStats)
    results.push(frameworkStats)
    
    // 生成总报告
    generateReport(results)
    
    logger.info('\n✅ 性能基准测试完成')
  } catch (error) {
    logger.error('❌ 测试失败', error)
    process.exit(1)
  }
}

// 运行测试
main().catch(console.error)
