/**
 * 脚本运行器
 *
 * 运行 package.json 中的 npm scripts
 *
 * @author LDesign Team
 * @since 2.1.0
 */

import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import path from 'node:path'
import fs from 'fs-extra'

/**
 * 脚本信息
 */
export interface ScriptInfo {
  name: string
  command: string
  description?: string
  category?: 'dev' | 'build' | 'test' | 'lint' | 'other'
}

/**
 * 运行状态
 */
export interface RunningScript {
  name: string
  pid: number
  startTime: number
  status: 'running' | 'success' | 'error'
  output: string[]
  exitCode?: number
}

/**
 * 脚本运行器
 */
export class ScriptRunner extends EventEmitter {
  private cwd: string
  private runningScripts: Map<string, { process: ChildProcess, info: RunningScript }> = new Map()

  constructor(cwd: string) {
    super()
    this.cwd = cwd
  }

  /**
   * 获取所有可用脚本
   */
  async getScripts(): Promise<ScriptInfo[]> {
    const pkgPath = path.join(this.cwd, 'package.json')

    if (!await fs.pathExists(pkgPath)) {
      return []
    }

    const pkg = await fs.readJson(pkgPath)
    const scripts = pkg.scripts || {}

    return Object.entries(scripts).map(([name, command]) => ({
      name,
      command: command as string,
      category: this.categorizeScript(name),
      description: this.getScriptDescription(name, command as string),
    }))
  }

  /**
   * 分类脚本
   */
  private categorizeScript(name: string): ScriptInfo['category'] {
    if (/^(dev|start|serve)/.test(name))
      return 'dev'
    if (/^(build|compile|bundle)/.test(name))
      return 'build'
    if (/^(test|spec|e2e)/.test(name))
      return 'test'
    if (/^(lint|format|prettier|eslint)/.test(name))
      return 'lint'
    return 'other'
  }

  /**
   * 获取脚本描述
   */
  private getScriptDescription(name: string, command: string): string {
    const descriptions: Record<string, string> = {
      'dev': '启动开发服务器',
      'start': '启动应用',
      'build': '构建生产版本',
      'test': '运行测试',
      'test:unit': '运行单元测试',
      'test:e2e': '运行端到端测试',
      'lint': '代码检查',
      'lint:fix': '代码检查并修复',
      'format': '格式化代码',
      'preview': '预览构建结果',
      'typecheck': '类型检查',
      'prepare': '准备钩子',
    }

    if (descriptions[name]) {
      return descriptions[name]
    }

    // 从命令推断
    if (command.includes('vite') || command.includes('launcher dev')) {
      return '开发服务器'
    }
    if (command.includes('vitest') || command.includes('jest')) {
      return '运行测试'
    }
    if (command.includes('eslint')) {
      return 'ESLint 检查'
    }
    if (command.includes('prettier')) {
      return '代码格式化'
    }
    if (command.includes('tsc')) {
      return 'TypeScript 编译'
    }

    return ''
  }

  /**
   * 运行脚本
   */
  async run(scriptName: string, args: string[] = []): Promise<string> {
    const scripts = await this.getScripts()
    const script = scripts.find(s => s.name === scriptName)

    if (!script) {
      throw new Error(`脚本 "${scriptName}" 不存在`)
    }

    // 检查是否已在运行
    if (this.runningScripts.has(scriptName)) {
      throw new Error(`脚本 "${scriptName}" 正在运行中`)
    }

    const runId = `${scriptName}-${Date.now()}`

    // 确定包管理器
    const pm = await this.detectPackageManager()
    const pmArgs = pm === 'npm' ? ['run', scriptName, '--'] : [scriptName]

    const child = spawn(pm, [...pmArgs, ...args], {
      cwd: this.cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    })

    const info: RunningScript = {
      name: scriptName,
      pid: child.pid || 0,
      startTime: Date.now(),
      status: 'running',
      output: [],
    }

    this.runningScripts.set(scriptName, { process: child, info })

    // 处理输出
    child.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      info.output.push(...lines)
      this.emit('output', { scriptName, type: 'stdout', data: lines })
    })

    child.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean)
      info.output.push(...lines)
      this.emit('output', { scriptName, type: 'stderr', data: lines })
    })

    child.on('close', (code) => {
      info.status = code === 0 ? 'success' : 'error'
      info.exitCode = code || 0
      this.runningScripts.delete(scriptName)
      this.emit('close', { scriptName, code, duration: Date.now() - info.startTime })
    })

    child.on('error', (error) => {
      info.status = 'error'
      this.runningScripts.delete(scriptName)
      this.emit('error', { scriptName, error })
    })

    return runId
  }

  /**
   * 停止脚本
   */
  stop(scriptName: string): boolean {
    const running = this.runningScripts.get(scriptName)
    if (!running) {
      return false
    }

    running.process.kill('SIGTERM')
    this.runningScripts.delete(scriptName)
    this.emit('stopped', { scriptName })
    return true
  }

  /**
   * 停止所有脚本
   */
  stopAll(): void {
    for (const [name] of this.runningScripts) {
      this.stop(name)
    }
  }

  /**
   * 获取运行中的脚本
   */
  getRunning(): RunningScript[] {
    return Array.from(this.runningScripts.values()).map(r => r.info)
  }

  /**
   * 检测包管理器
   */
  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
    if (await fs.pathExists(path.join(this.cwd, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }
    if (await fs.pathExists(path.join(this.cwd, 'yarn.lock'))) {
      return 'yarn'
    }
    return 'npm'
  }
}

// 单例
let runnerInstance: ScriptRunner | null = null

export function getScriptRunner(cwd?: string): ScriptRunner {
  if (!runnerInstance || cwd) {
    runnerInstance = new ScriptRunner(cwd || process.cwd())
  }
  return runnerInstance
}
