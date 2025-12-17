#!/usr/bin/env node

/**
 * @ldesign/launcher CLI 入口文件
 *
 * 这是 launcher 命令的可执行入口文件
 *
 * @author LDesign Team
 * @since 1.0.0
 */

// 设置未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message)
  if (process.env.DEBUG) {
    console.error(error.stack)
  }
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason)
  process.exit(1)
})

// 动态导入 CLI 模块
async function main() {
  try {
    // 首先检查 Node.js 版本（带交互式 Volta 安装）
    const { checkAndHandleNodeVersion } = await import('../dist/utils/node-version-check.js')
    const versionOk = await checkAndHandleNodeVersion()
    if (!versionOk) {
      // 版本不满足，已显示提示，优雅退出
      process.exit(process.env.CI ? 1 : 0)
    }

    // 导入 CLI 模块
    const mod = await import('../dist/cli/index.js')
    const createCli = mod.createCli || (typeof mod.default === 'function' ? mod.default : mod.default?.createCli)

    if (!createCli || typeof createCli !== 'function') {
      throw new Error('无法找到 createCli 函数')
    }

    // 导入并执行 bootstrap 初始化
    const coreModule = await import('../dist/index.js')
    if (typeof coreModule.bootstrap === 'function') {
      await coreModule.bootstrap()
    }

    // 创建并运行 CLI
    const cli = createCli()
    await cli.run()

  } catch (error) {
    // 只在非静默模式下输出错误信息
    const isSilent = process.argv.includes('--silent') || process.argv.includes('-s')

    if (!isSilent) {
      // 如果导入失败，可能是开发环境，提示构建
      if (error.code === 'ERR_MODULE_NOT_FOUND') {
        console.error('❌ 找不到构建文件，请先运行构建命令:')
        console.error('  pnpm run build')
        console.error('')
        console.error('或者在开发环境中运行:')
        console.error('  pnpm run dev')
      } else {
        console.error('❌ CLI 启动失败:', error.message)
        if (process.env.DEBUG) {
          console.error(error.stack)
        }
      }
    }

    process.exit(1)
  }
}

// 运行主函数
main().catch((error) => {
  // 只在非静默模式下输出错误信息
  if (!process.argv.includes('--silent') && !process.argv.includes('-s')) {
    console.error('❌ 启动失败:', error.message)
  }
  process.exit(1)
})
