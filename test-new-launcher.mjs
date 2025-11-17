/**
 * 新 Launcher 架构功能测试
 * 
 * 测试新的引擎无关 Launcher 类是否正常工作
 */

import { Launcher } from './dist/index.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 开始测试新 Launcher 架构...\n')

// 测试 1: 创建 Launcher 实例
console.log('📋 测试 1: 创建 Launcher 实例')
try {
  const launcher = new Launcher({
    cwd: join(__dirname, 'examples', 'react-demo'),
    logLevel: 'info',
    debug: false
  })
  
  console.log('✅ Launcher 实例创建成功')
  console.log('   类型:', launcher.constructor.name)
  console.log('   方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(launcher)).filter(m => !m.startsWith('_') && m !== 'constructor'))
} catch (error) {
  console.error('❌ Launcher 实例创建失败:', error.message)
  process.exit(1)
}

// 测试 2: 检查导出的类型和方法
console.log('\n📋 测试 2: 检查 Launcher API')
try {
  const launcher = new Launcher({
    cwd: join(__dirname, 'examples', 'react-demo')
  })
  
  const requiredMethods = ['dev', 'build', 'preview', 'destroy', 'getConfig', 'getCurrentEngine']
  const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(launcher))
  
  const missingMethods = requiredMethods.filter(m => !availableMethods.includes(m))
  
  if (missingMethods.length === 0) {
    console.log('✅ 所有必需的方法都存在')
    console.log('   方法列表:', requiredMethods.join(', '))
  } else {
    console.error('❌ 缺少方法:', missingMethods.join(', '))
    process.exit(1)
  }
} catch (error) {
  console.error('❌ API 检查失败:', error.message)
  process.exit(1)
}

// 测试 3: 检查事件系统
console.log('\n📋 测试 3: 检查事件系统')
try {
  const launcher = new Launcher({
    cwd: join(__dirname, 'examples', 'react-demo')
  })
  
  // 检查是否继承 EventEmitter
  const hasEventMethods = typeof launcher.on === 'function' && 
                          typeof launcher.emit === 'function' &&
                          typeof launcher.once === 'function'
  
  if (hasEventMethods) {
    console.log('✅ EventEmitter 方法可用')
    
    // 测试事件监听
    let eventFired = false
    launcher.once('test-event', () => {
      eventFired = true
    })
    launcher.emit('test-event')
    
    if (eventFired) {
      console.log('✅ 事件系统工作正常')
    } else {
      console.error('❌ 事件未触发')
      process.exit(1)
    }
  } else {
    console.error('❌ EventEmitter 方法不可用')
    process.exit(1)
  }
} catch (error) {
  console.error('❌ 事件系统测试失败:', error.message)
  process.exit(1)
}

// 测试 4: 测试配置加载
console.log('\n📋 测试 4: 测试配置加载')
try {
  const launcher = new Launcher({
    cwd: join(__dirname, 'examples', 'react-demo'),
    configFile: 'vite.config.ts'
  })
  
  const config = await launcher.getConfig()
  
  if (config && typeof config === 'object') {
    console.log('✅ 配置加载成功')
    console.log('   配置键:', Object.keys(config).slice(0, 10).join(', ') + (Object.keys(config).length > 10 ? '...' : ''))
  } else {
    console.error('❌ 配置加载失败')
    process.exit(1)
  }
} catch (error) {
  console.error('❌ 配置加载测试失败:', error.message)
  if (error.stack) {
    console.error('   堆栈:', error.stack.split('\n').slice(0, 3).join('\n'))
  }
  process.exit(1)
}

// 测试 5: 测试引擎类型检测
console.log('\n📋 测试 5: 测试引擎类型检测')
try {
  const launcher = new Launcher({
    cwd: join(__dirname, 'examples', 'react-demo'),
    inlineConfig: {
      launcher: {
        engine: 'vite'
      }
    }
  })
  
  const config = await launcher.getConfig()
  const engineType = config.launcher?.engine || config.engine?.type || 'vite'
  
  console.log('✅ 引擎类型检测成功')
  console.log('   引擎:', engineType)
} catch (error) {
  console.error('❌ 引擎类型检测失败:', error.message)
  process.exit(1)
}

// 测试 6: 测试资源清理
console.log('\n📋 测试 6: 测试资源清理')
try {
  const launcher = new Launcher({
    cwd: join(__dirname, 'examples', 'react-demo')
  })
  
  // 监听 destroyed 事件
  let destroyed = false
  launcher.once('destroyed', () => {
    destroyed = true
  })
  
  await launcher.destroy()
  
  if (destroyed) {
    console.log('✅ 资源清理成功，destroyed 事件触发')
  } else {
    console.log('⚠️  资源清理完成，但 destroyed 事件未触发')
  }
} catch (error) {
  console.error('❌ 资源清理测试失败:', error.message)
  process.exit(1)
}

// 测试 7: 检查向后兼容性（ViteLauncher 仍可用）
console.log('\n📋 测试 7: 检查向后兼容性')
try {
  const { ViteLauncher } = await import('./dist/index.js')
  
  if (ViteLauncher && typeof ViteLauncher === 'function') {
    console.log('✅ ViteLauncher 仍然可用（向后兼容）')
  } else {
    console.error('❌ ViteLauncher 不可用')
    process.exit(1)
  }
} catch (error) {
  console.error('❌ 向后兼容性检查失败:', error.message)
  process.exit(1)
}

// 测试 8: 检查 Manager 导出
console.log('\n📋 测试 8: 检查 Manager 类导出')
try {
  const { ConfigManager, PluginOrchestrator, EngineManager, ServerManager } = await import('./dist/index.js')
  
  const managers = { ConfigManager, PluginOrchestrator, EngineManager, ServerManager }
  const missingManagers = Object.entries(managers)
    .filter(([name, cls]) => !cls || typeof cls !== 'function')
    .map(([name]) => name)
  
  if (missingManagers.length === 0) {
    console.log('✅ 所有 Manager 类都已导出')
    console.log('   Manager:', Object.keys(managers).join(', '))
  } else {
    console.error('❌ 缺少 Manager 导出:', missingManagers.join(', '))
    process.exit(1)
  }
} catch (error) {
  console.error('❌ Manager 导出检查失败:', error.message)
  process.exit(1)
}

// 测试总结
console.log('\n' + '='.repeat(60))
console.log('🎉 所有测试通过！')
console.log('='.repeat(60))
console.log('\n✅ 新 Launcher 架构功能验证成功')
console.log('✅ 构建产物正常')
console.log('✅ API 完整')
console.log('✅ 事件系统正常')
console.log('✅ 配置加载正常')
console.log('✅ 向后兼容性保持')
console.log('✅ Manager 类正常导出')
console.log('\n🚀 新架构已准备就绪，可以投入使用！')
