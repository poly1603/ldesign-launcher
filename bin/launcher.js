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
    // 检测快速命令（--help, --version, help, version）
    const args = process.argv.slice(2)
    const isHelpCommand = args.length === 0 || args.some(arg =>
      arg === '--help' || arg === '-h' || arg === 'help'
    )
    const isVersionCommand = args.some(arg =>
      arg === '--version' || arg === '-v' || arg === 'version'
    )

    // 快速路径：直接处理 --help 和 --version，避免加载任何模块
    if (isHelpCommand) {
      await handleHelpCommand(args)
      return
    }

    if (isVersionCommand) {
      await handleVersionCommand()
      return
    }

    // 非快速命令才进行完整初始化
    const { checkAndHandleNodeVersion } = await import('../dist/utils/node-version-check.js')
    const versionOk = await checkAndHandleNodeVersion()
    if (!versionOk) {
      process.exit(process.env.CI ? 1 : 0)
    }

    // 初始化 bootstrap（注册引擎和框架）
    const coreModule = await import('../dist/index.js')
    if (typeof coreModule.bootstrap === 'function') {
      await coreModule.bootstrap()
    }

    // 导入完整的 CLI 模块
    const mod = await import('../dist/cli/index.js')
    const createCli = mod.createCli || (typeof mod.default === 'function' ? mod.default : mod.default?.createCli)

    if (!createCli || typeof createCli !== 'function') {
      throw new Error('无法找到 createCli 函数')
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

/**
 * 快速处理 help 命令（不加载任何重型模块）
 */
async function handleHelpCommand(args) {
  // 直接输出帮助信息，不加载任何模块
  const subCommand = args.find(arg => !arg.startsWith('-') && arg !== 'help')

  if (subCommand) {
    showCommandHelp(subCommand)
  } else if (args.includes('--all')) {
    showAllHelp()
  } else {
    showMainHelp()
  }
}

/**
 * 显示主要帮助信息
 */
function showMainHelp() {
  console.log('\n\x1b[36m@ldesign/launcher\x1b[0m - 基于 Vite 的前端项目启动器\n')
  console.log('\x1b[33m使用方法:\x1b[0m')
  console.log('  launcher <command> [options]\n')
  console.log('\x1b[33m可用命令:\x1b[0m')
  console.log('  \x1b[32mdev\x1b[0m         启动开发服务器')
  console.log('  \x1b[32mbuild\x1b[0m       执行生产构建')
  console.log('  \x1b[32mpreview\x1b[0m     预览构建结果')
  console.log('  \x1b[32mdeploy\x1b[0m      部署应用程序')
  console.log('  \x1b[32mcreate\x1b[0m      创建新项目')
  console.log('  \x1b[32mgenerate\x1b[0m    生成代码模板')
  console.log('  \x1b[32manalyze\x1b[0m     分析构建产物')
  console.log('  \x1b[32mlint\x1b[0m        运行代码检查')
  console.log('  \x1b[32mconfig\x1b[0m      管理配置文件')
  console.log('  \x1b[32mdoctor\x1b[0m      诊断项目问题')
  console.log('  \x1b[32mui\x1b[0m          启动 Web UI 界面')
  console.log('  \x1b[32mhelp\x1b[0m        显示帮助信息')
  console.log('  \x1b[32mversion\x1b[0m     显示版本信息\n')
  console.log('\x1b[33m全局选项:\x1b[0m')
  console.log('  \x1b[36m-h, --help\x1b[0m       显示帮助信息')
  console.log('  \x1b[36m-v, --version\x1b[0m    显示版本信息')
  console.log('  \x1b[36m-c, --config\x1b[0m     指定配置文件路径')
  console.log('  \x1b[36m-m, --mode\x1b[0m       指定运行模式')
  console.log('  \x1b[36m-d, --debug\x1b[0m      启用调试模式')
  console.log('  \x1b[36m-s, --silent\x1b[0m     静默模式\n')
  console.log('\x1b[33m获取更多帮助:\x1b[0m')
  console.log('  launcher help <command>  显示特定命令的帮助')
  console.log('  launcher help --all      显示所有命令的详细帮助\n')
}

/**
 * 显示命令帮助
 */
function showCommandHelp(command) {
  const helpTexts = {
    dev: `
\x1b[36mDEV 命令\x1b[0m - 启动开发服务器

\x1b[33m使用方法:\x1b[0m
  launcher dev [options]

\x1b[33m选项:\x1b[0m
  \x1b[36m--port <number>\x1b[0m      指定端口号
  \x1b[36m--host <string>\x1b[0m      指定主机地址
  \x1b[36m--open [path]\x1b[0m        启动时自动打开浏览器
  \x1b[36m--force\x1b[0m              强制重新构建依赖

\x1b[33m示例:\x1b[0m
  \x1b[32mlauncher dev\x1b[0m
  \x1b[32mlauncher dev --port 3000\x1b[0m
  \x1b[32mlauncher dev --host 0.0.0.0 --open\x1b[0m
`,
    build: `
\x1b[36mBUILD 命令\x1b[0m - 执行生产构建

\x1b[33m使用方法:\x1b[0m
  launcher build [options]

\x1b[33m选项:\x1b[0m
  \x1b[36m--outDir <path>\x1b[0m      指定输出目录
  \x1b[36m--sourcemap\x1b[0m          生成 sourcemap 文件
  \x1b[36m--minify\x1b[0m             压缩代码
  \x1b[36m--watch\x1b[0m              监听模式

\x1b[33m示例:\x1b[0m
  \x1b[32mlauncher build\x1b[0m
  \x1b[32mlauncher build --outDir dist\x1b[0m
  \x1b[32mlauncher build --sourcemap --minify\x1b[0m
`,
    preview: `
\x1b[36mPREVIEW 命令\x1b[0m - 预览构建结果

\x1b[33m使用方法:\x1b[0m
  launcher preview [options]

\x1b[33m选项:\x1b[0m
  \x1b[36m--port <number>\x1b[0m      指定端口号
  \x1b[36m--host <string>\x1b[0m      指定主机地址
  \x1b[36m--open [path]\x1b[0m        自动打开浏览器

\x1b[33m示例:\x1b[0m
  \x1b[32mlauncher preview\x1b[0m
  \x1b[32mlauncher preview --port 4173\x1b[0m
`,
  }

  if (helpTexts[command]) {
    console.log(helpTexts[command])
  } else {
    console.log(`\n\x1b[31m未知命令: ${command}\x1b[0m\n`)
    console.log('可用命令: dev, build, preview, deploy, create, generate, analyze, lint, config, doctor, ui, help, version\n')
  }
}

/**
 * 显示所有帮助
 */
function showAllHelp() {
  showMainHelp()
  console.log('\x1b[36m' + '='.repeat(60) + '\x1b[0m\n')
  showCommandHelp('dev')
  showCommandHelp('build')
  showCommandHelp('preview')
}

/**
 * 快速处理 version 命令（不加载任何重型模块）
 */
async function handleVersionCommand() {
  // 直接输出版本信息，不加载任何模块
  try {
    // 读取 package.json 获取版本
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const { fileURLToPath } = await import('node:url')

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const packageJsonPath = path.join(__dirname, '..', 'package.json')

    let version = '2.0.0' // 默认版本

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      version = packageJson.version || version
    } catch {
      // 忽略错误，使用默认版本
    }

    console.log(`\n\x1b[36m@ldesign/launcher\x1b[0m v${version}`)
    console.log(`\x1b[36mnode\x1b[0m ${process.version}`)
    console.log(`\x1b[36mplatform\x1b[0m ${process.platform}\n`)
  } catch (error) {
    console.log('\n@ldesign/launcher v2.0.0')
    console.log(`node ${process.version}\n`)
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
