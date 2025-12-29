/**
 * Node.js 版本检查与 Volta 自动安装模块
 *
 * 当检测到 Node.js 版本不符合要求时，提供友好的提示并可选自动安装 Volta
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { execSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

// ANSI 颜色代码
const colors = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  magenta: '\x1B[35m',
}

// 最低版本要求
const MIN_NODE_VERSION = {
  major20: { major: 20, minor: 19 },
  major22: { major: 22, minor: 12 },
}

const RECOMMENDED_NODE_VERSION = '22.12.0'

/**
 * 检查当前 Node.js 版本是否满足要求
 */
export function checkNodeVersion(): {
  supported: boolean
  current: string
  major: number
  minor: number
} {
  const envVersion = process.env.VOLTA_PROJECT_NODE_VERSION || process.env.npm_config_node_version
  const nodeVersion = envVersion || process.version
  const versionParts = nodeVersion.slice(1).split('.').map(Number)
  const major = versionParts[0]
  const minor = versionParts[1]

  const supported
    = (major === 20 && minor >= MIN_NODE_VERSION.major20.minor)
      || major === 21
      || (major >= 22 && minor >= MIN_NODE_VERSION.major22.minor)
      || major >= 23

  return { supported, current: nodeVersion, major, minor }
}

/**
 * 检查 Volta 是否已安装
 */
export function isVoltaInstalled(): boolean {
  try {
    execSync('volta --version', { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

/**
 * 查找项目根目录的 package.json
 */
function findProjectPackageJson(startDir: string = process.cwd()): string | null {
  let dir = startDir
  while (dir !== join(dir, '..')) {
    const pkgPath = join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      return pkgPath
    }
    dir = join(dir, '..')
  }
  return null
}

/**
 * 检查并添加 Volta 配置到 package.json
 */
export function ensureVoltaConfig(pkgJsonPath?: string): {
  added: boolean
  path: string | null
} {
  const targetPath = pkgJsonPath || findProjectPackageJson()
  if (!targetPath) {
    return { added: false, path: null }
  }

  try {
    const content = readFileSync(targetPath, 'utf-8')
    const pkg = JSON.parse(content)

    if (pkg.volta?.node) {
      return { added: false, path: targetPath }
    }

    // 添加 volta 配置
    pkg.volta = {
      node: RECOMMENDED_NODE_VERSION,
      ...(pkg.volta || {}),
    }

    // 保持格式化
    const indent = content.match(/^(\s+)/m)?.[1] || '  '
    writeFileSync(targetPath, `${JSON.stringify(pkg, null, indent)}\n`, 'utf-8')

    return { added: true, path: targetPath }
  }
  catch {
    return { added: false, path: targetPath }
  }
}

/**
 * 创建用户交互询问
 */
function askQuestion(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

/**
 * 安装 Volta
 */
async function installVolta(): Promise<boolean> {
  const isWindows = process.platform === 'win32'

  console.log('')
  console.log(`  ${colors.cyan}⏳ 正在安装 Volta...${colors.reset}`)
  console.log('')

  try {
    if (isWindows) {
      // Windows: 使用 winget 或 PowerShell 脚本
      try {
        // 尝试使用 winget
        execSync('winget install Volta.Volta -e --silent', {
          stdio: 'inherit',
        })
        return true
      }
      catch {
        // 回退到 PowerShell 脚本
        console.log(`  ${colors.dim}winget 不可用，尝试使用 PowerShell 安装...${colors.reset}`)
        execSync(
          'powershell -Command "irm https://get.volta.sh | iex"',
          { stdio: 'inherit' },
        )
        return true
      }
    }
    else {
      // macOS / Linux: 使用 curl 脚本
      return new Promise((resolve) => {
        const child = spawn('sh', ['-c', 'curl https://get.volta.sh | bash'], {
          stdio: 'inherit',
        })
        child.on('close', (code) => {
          resolve(code === 0)
        })
        child.on('error', () => {
          resolve(false)
        })
      })
    }
  }
  catch (error) {
    console.log(`  ${colors.red}❌ Volta 安装失败${colors.reset}`)
    console.log(`  ${colors.dim}请手动访问 https://volta.sh 安装${colors.reset}`)
    return false
  }
}

/**
 * 显示版本不兼容的友好提示
 */
function showVersionWarning(current: string): void {
  const width = 66
  const border = `${colors.dim}${'─'.repeat(width)}${colors.reset}`

  console.log('')
  console.log(`  ${colors.dim}╭${border}╮${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.yellow}${colors.bright}👋 温馨提示：需要升级 Node.js 版本${colors.reset}${' '.repeat(30)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}├${border}┤${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  @ldesign/launcher 已升级至 ${colors.blue}Vite 7.x${colors.reset}，需要更新的 Node.js 🚀    ${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.dim}当前版本:${colors.reset} ${colors.red}${current.padEnd(12)}${colors.reset}${' '.repeat(41)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.dim}推荐版本:${colors.reset} ${colors.green}v20.19.0+${colors.reset} 或 ${colors.green}v22.12.0+${colors.reset}${' '.repeat(27)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}╰${border}╯${colors.reset}`)
  console.log('')
}

/**
 * 显示 Volta 安装成功后的提示
 */
function showSuccessMessage(voltaConfigAdded: boolean, pkgPath: string | null): void {
  const width = 66
  const border = `${colors.dim}${'─'.repeat(width)}${colors.reset}`

  console.log('')
  console.log(`  ${colors.dim}╭${border}╮${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.green}${colors.bright}✅ Volta 安装成功！${colors.reset}${' '.repeat(46)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}├${border}┤${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)

  if (voltaConfigAdded && pkgPath) {
    console.log(`  ${colors.dim}│${colors.reset}  ${colors.cyan}📦 已自动添加 Volta 配置到 package.json${colors.reset}${' '.repeat(23)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}  ${colors.dim}   "volta": { "node": "${RECOMMENDED_NODE_VERSION}" }${colors.reset}${' '.repeat(28)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  }

  console.log(`  ${colors.dim}│${colors.reset}  ${colors.yellow}⚠️  请重新打开终端${colors.reset}，然后执行:${' '.repeat(30)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.bright}${colors.cyan}pnpm dev${colors.reset}${' '.repeat(56)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.dim}Volta 会自动为此项目使用 Node.js ${RECOMMENDED_NODE_VERSION}${colors.reset}${' '.repeat(19)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}╰${border}╯${colors.reset}`)
  console.log('')
}

/**
 * 显示手动升级提示
 */
function showManualUpgradeHint(): void {
  const width = 66
  const border = `${colors.dim}${'─'.repeat(width)}${colors.reset}`

  console.log(`  ${colors.dim}╭${border}╮${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.bright}如何手动升级？${colors.reset}${' '.repeat(50)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.cyan}• nvm:${colors.reset}      nvm install 22 && nvm use 22${' '.repeat(23)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.cyan}• fnm:${colors.reset}      fnm install 22 && fnm use 22${' '.repeat(23)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}  ${colors.cyan}• 官网:${colors.reset}     https://nodejs.org/${' '.repeat(30)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
  console.log(`  ${colors.dim}╰${border}╯${colors.reset}`)
  console.log('')
}

function hasProjectVoltaConfig(pkgJsonPath?: string | null): boolean {
  if (!pkgJsonPath)
    return false
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    return !!pkg.volta?.node
  }
  catch {
    return false
  }
}

function tryReexecWithVolta(pkgJsonPath?: string | null): boolean {
  if (process.env.LDESIGN_LAUNCHER_VOLTA_REEXEC === '1') {
    return false
  }

  if (!isVoltaInstalled() || !hasProjectVoltaConfig(pkgJsonPath)) {
    return false
  }

  const args = process.argv.slice(1)
  const result = spawnSync('volta', ['run', 'node', ...args], {
    stdio: 'inherit',
    env: {
      ...process.env,
      LDESIGN_LAUNCHER_VOLTA_REEXEC: '1',
    },
  })

  const exitCode = result.status ?? 1
  process.exit(exitCode)
}

/**
 * 主入口：检查 Node 版本并处理升级流程
 *
 * @returns true 表示版本满足要求或用户选择继续，false 表示应该退出
 */
export async function checkAndHandleNodeVersion(): Promise<boolean> {
  const versionInfo = checkNodeVersion()

  if (versionInfo.supported) {
    return true
  }

  // 显示版本警告
  showVersionWarning(versionInfo.current)

  const pkgJsonPath = findProjectPackageJson()
  const hasVoltaConfig = hasProjectVoltaConfig(pkgJsonPath)
  const voltaInstalled = isVoltaInstalled()

  // 如果 Volta 可用且项目已配置，尝试自动重启
  if (voltaInstalled && hasVoltaConfig) {
    tryReexecWithVolta(pkgJsonPath)
  }

  if (voltaInstalled || hasVoltaConfig) {
    const width = 66
    const border = `${colors.dim}${'─'.repeat(width)}${colors.reset}`

    console.log(`  ${colors.dim}╭${border}╮${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}  ${colors.green}✓${colors.reset} ${voltaInstalled ? '检测到已安装 Volta' : '检测到项目已配置 Volta'}${' '.repeat(voltaInstalled ? 44 : 40)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}├${border}┤${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}  当前终端的 Node 版本未被 Volta 接管，可能原因：${' '.repeat(15)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}  ${colors.yellow}1.${colors.reset} VS Code 需要完全重启（不只是终端）${' '.repeat(26)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}  ${colors.yellow}2.${colors.reset} 或在 VS Code 外部打开 PowerShell/CMD 测试${' '.repeat(19)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}├${border}┤${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}  ${colors.bright}验证方法：${colors.reset} 在新终端运行 ${colors.cyan}node --version${colors.reset}${' '.repeat(23)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}  ${colors.dim}如果显示 v22.x，说明 Volta 已生效，重启 VS Code 即可${colors.reset}${' '.repeat(6)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}│${colors.reset}${' '.repeat(66)}${colors.dim}│${colors.reset}`)
    console.log(`  ${colors.dim}╰${border}╯${colors.reset}`)
    console.log('')

    // 确保 volta 配置存在
    if (!hasVoltaConfig) {
      const { added, path } = ensureVoltaConfig()
      if (added && path) {
        console.log(`  ${colors.cyan}📦${colors.reset} 已自动添加 Volta 配置到 ${colors.dim}${path}${colors.reset}`)
        console.log('')
      }
    }

    return false
  }

  // 询问是否安装 Volta
  console.log(`  ${colors.magenta}💡${colors.reset} 推荐使用 ${colors.bright}Volta${colors.reset} 自动管理 Node.js 版本`)
  console.log(`  ${colors.dim}   Volta 会为每个项目自动切换到正确的 Node 版本，无需手动操作${colors.reset}`)
  console.log('')

  const answer = await askQuestion(
    `  ${colors.cyan}?${colors.reset} 是否自动安装 Volta？${colors.dim}(Y/n)${colors.reset} `,
  )

  if (answer === '' || answer === 'y' || answer === 'yes') {
    const success = await installVolta()

    if (success) {
      // 添加 volta 配置到 package.json
      const { added, path } = ensureVoltaConfig()
      showSuccessMessage(added, path)
    }

    return false
  }

  // 用户选择不安装，显示手动升级提示
  console.log('')
  showManualUpgradeHint()

  return false
}

/**
 * 同步版本检查（用于入口文件，不支持交互）
 */
export function checkNodeVersionSync(): boolean {
  const versionInfo = checkNodeVersion()

  if (versionInfo.supported) {
    return true
  }

  showVersionWarning(versionInfo.current)
  showManualUpgradeHint()

  return false
}
