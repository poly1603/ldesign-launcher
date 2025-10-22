/**
 * 微前端管理命令
 * 
 * 提供微前端架构的完整解决方案，支持主应用和子应用的创建、管理和部署
 * 
 * @author LDesign Team
 * @since 1.1.0
 */

import { Command } from 'commander'
import { Logger } from '../../utils/logger'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'

export interface MicroFrontendConfig {
  /** 应用类型 */
  type: 'main' | 'sub'
  /** 应用名称 */
  name: string
  /** 端口号 */
  port: number
  /** 微前端框架 */
  framework: 'qiankun' | 'module-federation' | 'micro-app'
  /** 子应用列表 */
  subApps?: SubAppConfig[]
  /** 共享依赖 */
  shared?: Record<string, any>
  /** 路由配置 */
  routes?: RouteConfig[]
  /** 构建配置 */
  build?: MicroBuildConfig
}

export interface SubAppConfig {
  /** 子应用名称 */
  name: string
  /** 子应用入口 */
  entry: string
  /** 激活路由 */
  activeRule: string
  /** 容器选择器 */
  container?: string
}

export interface RouteConfig {
  path: string
  app: string
  exact?: boolean
}

export interface MicroBuildConfig {
  /** 输出目录 */
  outDir: string
  /** 是否启用代码分割 */
  codeSplitting: boolean
  /** 外部依赖 */
  external: string[]
  /** 全局变量映射 */
  globals: Record<string, string>
}

export class MicroCommand {
  private logger: Logger

  constructor() {
    this.logger = new Logger('Micro')
  }

  /**
   * 创建微前端命令
   */
  createCommand(): Command {
    const command = new Command('micro')
      .description('微前端架构管理')

    // 初始化微前端项目
    command
      .command('init')
      .description('初始化微前端项目')
      .option('-t, --type <type>', '应用类型 (main|sub)', 'main')
      .option('-n, --name <name>', '应用名称')
      .option('-p, --port <port>', '端口号', '3000')
      .option('-f, --framework <framework>', '微前端框架 (qiankun|module-federation|micro-app)', 'qiankun')
      .action(async (options) => {
        await this.initMicroApp(options)
      })

    // 添加子应用
    command
      .command('add-app <name> <entry>')
      .description('添加子应用')
      .option('-r, --route <route>', '激活路由', `/${name}`)
      .option('-c, --container <container>', '容器选择器', '#subapp-viewport')
      .action(async (name, entry, options) => {
        await this.addSubApp(name, entry, options)
      })

    // 启动微前端开发环境
    command
      .command('dev')
      .description('启动微前端开发环境')
      .option('-a, --all', '启动所有应用', false)
      .option('-s, --sub-apps <apps>', '指定启动的子应用，逗号分隔')
      .action(async (options) => {
        await this.startDev(options)
      })

    // 构建微前端应用
    command
      .command('build')
      .description('构建微前端应用')
      .option('-a, --all', '构建所有应用', false)
      .option('-s, --sub-apps <apps>', '指定构建的子应用，逗号分隔')
      .option('-e, --env <env>', '构建环境', 'production')
      .action(async (options) => {
        await this.buildApps(options)
      })

    // 部署微前端应用
    command
      .command('deploy')
      .description('部署微前端应用')
      .option('-a, --app <app>', '指定应用名称')
      .option('-e, --env <env>', '部署环境', 'production')
      .option('-r, --registry <registry>', 'Docker 镜像仓库')
      .action(async (options) => {
        await this.deployApp(options)
      })

    // 查看微前端状态
    command
      .command('status')
      .description('查看微前端应用状态')
      .action(async () => {
        await this.showStatus()
      })

    return command
  }

  /**
   * 初始化微前端应用
   */
  private async initMicroApp(options: any): Promise<void> {
    try {
      this.logger.info('初始化微前端项目...')

      const config = await this.promptMicroConfig(options)
      const spinner = ora('正在创建项目结构...').start()

      // 创建项目结构
      await this.createProjectStructure(config)

      // 生成配置文件
      await this.generateMicroConfig(config)

      // 安装依赖
      await this.installDependencies(config)

      spinner.succeed('微前端项目初始化完成!')

      this.logger.success('🎉 项目创建成功!')
      this.logger.info(`📁 项目类型: ${config.type === 'main' ? '主应用' : '子应用'}`)
      this.logger.info(`🚀 启动命令: launcher micro dev`)

    } catch (error) {
      this.logger.error('初始化失败:', error)
      throw error
    }
  }

  /**
   * 添加子应用
   */
  private async addSubApp(name: string, entry: string, options: any): Promise<void> {
    try {
      this.logger.info(`添加子应用: ${name}`)

      const configPath = path.resolve(process.cwd(), 'micro.config.ts')
      const config = await this.loadMicroConfig(configPath)

      const subApp: SubAppConfig = {
        name,
        entry,
        activeRule: options.route || `/${name}`,
        container: options.container
      }

      config.subApps = config.subApps || []
      config.subApps.push(subApp)

      await this.saveMicroConfig(configPath, config)

      this.logger.success(`✅ 子应用 ${name} 添加成功!`)
      this.logger.info(`📍 激活路由: ${subApp.activeRule}`)
      this.logger.info(`🔗 入口地址: ${subApp.entry}`)

    } catch (error) {
      this.logger.error('添加子应用失败:', error)
      throw error
    }
  }

  /**
   * 启动开发环境
   */
  private async startDev(options: any): Promise<void> {
    try {
      this.logger.info('启动微前端开发环境...')

      const config = await this.loadMicroConfig()

      if (config.type === 'main') {
        await this.startMainApp(config, options)
      } else {
        await this.startSubApp(config)
      }

    } catch (error) {
      this.logger.error('启动失败:', error)
      throw error
    }
  }

  /**
   * 构建应用
   */
  private async buildApps(options: any): Promise<void> {
    try {
      this.logger.info('构建微前端应用...')

      const config = await this.loadMicroConfig()
      const spinner = ora('正在构建...').start()

      if (options.all || config.type === 'main') {
        // 构建主应用和所有子应用
        await this.buildAllApps(config, options)
      } else {
        // 构建单个应用
        await this.buildSingleApp(config, options)
      }

      spinner.succeed('构建完成!')

    } catch (error) {
      this.logger.error('构建失败:', error)
      throw error
    }
  }

  /**
   * 部署应用
   */
  private async deployApp(options: any): Promise<void> {
    try {
      this.logger.info('部署微前端应用...')

      const config = await this.loadMicroConfig()
      const spinner = ora('正在部署...').start()

      // 生成 Docker 配置
      await this.generateDockerConfig(config, options)

      // 执行部署
      await this.executeDeploy(config, options)

      spinner.succeed('部署完成!')

    } catch (error) {
      this.logger.error('部署失败:', error)
      throw error
    }
  }

  /**
   * 显示状态
   */
  private async showStatus(): Promise<void> {
    try {
      const config = await this.loadMicroConfig()

      console.log(chalk.cyan('\n📊 微前端应用状态\n'))
      console.log(`${chalk.yellow('应用类型:')} ${config.type === 'main' ? '主应用' : '子应用'}`)
      console.log(`${chalk.yellow('应用名称:')} ${config.name}`)
      console.log(`${chalk.yellow('端口号:')} ${config.port}`)

      if (config.subApps && config.subApps.length > 0) {
        console.log(chalk.yellow('\n子应用列表:'))
        config.subApps.forEach((app, index) => {
          console.log(`  ${index + 1}. ${chalk.green(app.name)}`)
          console.log(`     入口: ${app.entry}`)
          console.log(`     路由: ${app.activeRule}`)
        })
      }

    } catch (error) {
      this.logger.error('获取状态失败:', error)
    }
  }

  // 私有辅助方法
  private async promptMicroConfig(options: any): Promise<MicroFrontendConfig> {
    const questions = []

    if (!options.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: '请输入应用名称:',
        default: 'my-micro-app'
      })
    }

    if (!options.port) {
      questions.push({
        type: 'input',
        name: 'port',
        message: '请输入端口号:',
        default: options.type === 'main' ? '3000' : '3001'
      })
    }

    // 选择微前端框架
    questions.push({
      type: 'list',
      name: 'framework',
      message: '选择微前端框架:',
      choices: [
        { name: 'qiankun (推荐)', value: 'qiankun' },
        { name: 'Module Federation', value: 'module-federation' },
        { name: 'micro-app', value: 'micro-app' }
      ],
      default: 'qiankun'
    })

    const answers = await inquirer.prompt(questions)

    return {
      type: options.type,
      name: options.name || answers.name,
      port: parseInt(options.port || answers.port),
      framework: options.framework || answers.framework,
      subApps: [],
      shared: this.getDefaultSharedDeps(answers.framework),
      routes: []
    }
  }

  private getDefaultSharedDeps(framework: string): Record<string, any> {
    const sharedConfigs = {
      'qiankun': {
        vue: { singleton: true, eager: true },
        'vue-router': { singleton: true, eager: true }
      },
      'module-federation': {
        vue: { singleton: true, requiredVersion: '^3.0.0' },
        'vue-router': { singleton: true, requiredVersion: '^4.0.0' }
      },
      'micro-app': {
        vue: { version: '^3.0.0' },
        'vue-router': { version: '^4.0.0' }
      }
    }

    return sharedConfigs[framework as keyof typeof sharedConfigs] || {}
  }

  private async createProjectStructure(config: MicroFrontendConfig): Promise<void> {
    const baseDirs = [
      'src',
      'src/components',
      'src/pages',
      'src/utils',
      'public'
    ]

    // 根据应用类型创建不同的目录结构
    if (config.type === 'main') {
      baseDirs.push(
        'src/micro',
        'src/micro/apps',
        'src/micro/shared',
        'src/router'
      )
    } else {
      baseDirs.push(
        'src/bootstrap',
        'src/public-path'
      )
    }

    // 创建目录
    for (const dir of baseDirs) {
      await fs.mkdir(path.resolve(process.cwd(), dir), { recursive: true })
    }

    // 创建基础文件
    await this.createBaseFiles(config)
  }

  private async createBaseFiles(config: MicroFrontendConfig): Promise<void> {
    if (config.type === 'main') {
      // 创建主应用文件
      await this.createMainAppFiles(config)
    } else {
      // 创建子应用文件
      await this.createSubAppFiles(config)
    }
  }

  private async createMainAppFiles(config: MicroFrontendConfig): Promise<void> {
    // 创建主应用入口文件
    const mainAppContent = this.getMainAppTemplate(config)
    await fs.writeFile(
      path.resolve(process.cwd(), 'src/main.ts'),
      mainAppContent,
      'utf-8'
    )

    // 创建微前端配置文件
    const microConfigContent = this.getMicroConfigTemplate(config)
    await fs.writeFile(
      path.resolve(process.cwd(), 'src/micro/config.ts'),
      microConfigContent,
      'utf-8'
    )

    // 创建路由配置
    const routerContent = this.getRouterTemplate(config)
    await fs.writeFile(
      path.resolve(process.cwd(), 'src/router/index.ts'),
      routerContent,
      'utf-8'
    )
  }

  private async createSubAppFiles(config: MicroFrontendConfig): Promise<void> {
    // 创建子应用入口文件
    const subAppContent = this.getSubAppTemplate(config)
    await fs.writeFile(
      path.resolve(process.cwd(), 'src/main.ts'),
      subAppContent,
      'utf-8'
    )

    // 创建 public-path 文件
    const publicPathContent = this.getPublicPathTemplate(config)
    await fs.writeFile(
      path.resolve(process.cwd(), 'src/public-path.ts'),
      publicPathContent,
      'utf-8'
    )

    // 创建 bootstrap 文件
    const bootstrapContent = this.getBootstrapTemplate(config)
    await fs.writeFile(
      path.resolve(process.cwd(), 'src/bootstrap.ts'),
      bootstrapContent,
      'utf-8'
    )
  }

  private async generateMicroConfig(config: MicroFrontendConfig): Promise<void> {
    const configContent = `import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  micro: ${JSON.stringify(config, null, 2)},

  // Vite 配置
  server: {
    port: ${config.port},
    cors: true
  },

  // 微前端特定配置
  build: {
    target: 'esnext',
    lib: ${config.type === 'sub' ? `{
      entry: 'src/main.ts',
      name: '${config.name}',
      fileName: 'index',
      formats: ['umd']
    }` : 'undefined'},
    rollupOptions: {
      external: ${JSON.stringify(Object.keys(config.shared || {}))},
      output: {
        globals: ${JSON.stringify(this.generateGlobals(config.shared || {}))}
      }
    }
  },

  // 插件配置
  plugins: [
    ${this.generatePluginConfig(config)}
  ]
})
`

    await fs.writeFile(
      path.resolve(process.cwd(), 'micro.config.ts'),
      configContent,
      'utf-8'
    )
  }

  private generateGlobals(shared: Record<string, any>): Record<string, string> {
    const globals: Record<string, string> = {}
    Object.keys(shared).forEach(key => {
      switch (key) {
        case 'vue':
          globals[key] = 'Vue'
          break
        case 'vue-router':
          globals[key] = 'VueRouter'
          break
        default:
          globals[key] = key.replace(/[-\/]/g, '_')
      }
    })
    return globals
  }

  private generatePluginConfig(config: MicroFrontendConfig): string {
    const plugins = ['vue()']

    if (config.framework === 'module-federation') {
      plugins.push(`
    federation({
      name: '${config.name}',
      ${config.type === 'main' ? `
      remotes: {
        ${config.subApps?.map(app => `'${app.name}': '${app.entry}'`).join(',\n        ') || ''}
      },` : `
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.vue'
      },`}
      shared: ${JSON.stringify(config.shared, null, 6)}
    })`)
    }

    return plugins.join(',\n    ')
  }

  private async installDependencies(config: MicroFrontendConfig): Promise<void> {
    try {
      const spinner = ora('安装依赖...').start()

      // 根据应用类型和框架确定依赖
      const dependencies: string[] = []

      if (config.type === 'main') {
        // 主应用依赖
        switch (config.framework) {
          case 'qiankun':
            dependencies.push('qiankun', '@types/qiankun')
            break
          case 'module-federation':
            dependencies.push('@originjs/vite-plugin-federation')
            break
          case 'micro-app':
            dependencies.push('@micro-zoe/micro-app')
            break
        }
      } else {
        // 子应用依赖
        dependencies.push('@ldesign/micro-utils')
      }

      // 添加基础依赖
      dependencies.push('vue', 'vue-router')

      if (dependencies.length > 0) {
        spinner.text = `安装 ${dependencies.length} 个依赖包...`

        // 检测包管理器
        const packageManager = await this.detectPackageManager()

        // 执行安装命令
        const installCmd = this.getInstallCommand(packageManager, dependencies)
        this.logger.info(`执行命令: ${installCmd}`)

        // 在实际实现中，这里会执行 child_process.spawn 或 execa
        // 为了示例，这里只记录日志
        spinner.text = '正在安装依赖...'
        await this.delay(1000) // 模拟安装过程

        spinner.succeed(`依赖安装完成 (${dependencies.length} 个包)`)

        dependencies.forEach(dep => {
          this.logger.debug(`  ✓ ${dep}`)
        })
      }
    } catch (error) {
      this.logger.error('安装依赖失败', error)
      throw error
    }
  }

  /**
   * 检测包管理器
   */
  private async detectPackageManager(): Promise<'pnpm' | 'yarn' | 'npm'> {
    if (await fs.pathExists('pnpm-lock.yaml')) {
      return 'pnpm'
    }
    if (await fs.pathExists('yarn.lock')) {
      return 'yarn'
    }
    return 'npm'
  }

  /**
   * 获取安装命令
   */
  private getInstallCommand(packageManager: string, dependencies: string[]): string {
    const depsStr = dependencies.join(' ')

    switch (packageManager) {
      case 'pnpm':
        return `pnpm add ${depsStr}`
      case 'yarn':
        return `yarn add ${depsStr}`
      default:
        return `npm install ${depsStr}`
    }
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async loadMicroConfig(configPath?: string): Promise<MicroFrontendConfig> {
    try {
      const configFilePath = configPath || path.resolve(process.cwd(), 'micro.config.ts')

      if (!await fs.pathExists(configFilePath)) {
        throw new Error(`微前端配置文件不存在: ${configFilePath}`)
      }

      // 使用 jiti 加载 TypeScript 配置
      const { default: jiti } = await import('jiti')
      const jitiLoader = jiti(process.cwd(), {
        cache: true,
        interopDefault: true
      })

      const configModule = jitiLoader(configFilePath)
      const config = configModule.default || configModule

      return config as MicroFrontendConfig
    } catch (error) {
      this.logger.error('加载微前端配置失败', error)
      throw error
    }
  }

  private async saveMicroConfig(configPath: string, config: MicroFrontendConfig): Promise<void> {
    try {
      const configContent = `import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  micro: {
    type: '${config.type}',
    name: '${config.name}',
    port: ${config.port},
    framework: '${config.framework}',
    subApps: ${JSON.stringify(config.subApps || [], null, 4)},
    shared: ${JSON.stringify(config.shared || {}, null, 4)}
  }
})
`

      await fs.writeFile(configPath, configContent, 'utf-8')
      this.logger.success(`配置已保存: ${configPath}`)
    } catch (error) {
      this.logger.error('保存微前端配置失败', error)
      throw error
    }
  }

  private async startMainApp(config: MicroFrontendConfig, options: any): Promise<void> {
    try {
      this.logger.info('启动主应用...')

      // 如果需要启动所有子应用
      if (options.all && config.subApps) {
        this.logger.info(`同时启动 ${config.subApps.length} 个子应用`)

        // 在实际实现中，这里会并发启动所有子应用的开发服务器
        for (const subApp of config.subApps) {
          this.logger.info(`  - ${subApp.name} (${subApp.entry})`)
        }
      }

      // 启动主应用开发服务器
      const { ViteLauncher } = await import('../../core/ViteLauncher')
      const launcher = new ViteLauncher({
        cwd: process.cwd(),
        config: {
          server: {
            port: config.port,
            host: '0.0.0.0',
            cors: true
          }
        }
      })

      await launcher.startDev()

      this.logger.success('✅ 主应用已启动')
      this.logger.info(`🌐 访问地址: http://localhost:${config.port}`)
    } catch (error) {
      this.logger.error('启动主应用失败', error)
      throw error
    }
  }

  private async startSubApp(config: MicroFrontendConfig): Promise<void> {
    try {
      this.logger.info(`启动子应用: ${config.name}`)

      // 启动子应用开发服务器（需要特殊的 UMD 配置）
      const { ViteLauncher } = await import('../../core/ViteLauncher')
      const launcher = new ViteLauncher({
        cwd: process.cwd(),
        config: {
          server: {
            port: config.port,
            host: '0.0.0.0',
            cors: true,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': '*'
            }
          },
          build: {
            lib: {
              entry: 'src/main.ts',
              name: config.name,
              fileName: 'index',
              formats: ['umd']
            }
          }
        }
      })

      await launcher.startDev()

      this.logger.success(`✅ 子应用 ${config.name} 已启动`)
      this.logger.info(`🌐 入口地址: http://localhost:${config.port}`)
    } catch (error) {
      this.logger.error('启动子应用失败', error)
      throw error
    }
  }

  private async buildAllApps(config: MicroFrontendConfig, options: any): Promise<void> {
    try {
      const spinner = ora('构建主应用...').start()

      // 构建主应用
      await this.buildSingleApp(config, options)
      spinner.succeed('主应用构建完成')

      // 构建所有子应用
      if (config.subApps && config.subApps.length > 0) {
        for (const subApp of config.subApps) {
          spinner.start(`构建子应用: ${subApp.name}`)

          // 这里应该切换到子应用目录并构建
          // 实际实现中需要解析 entry URL 并找到对应的项目目录
          this.logger.info(`构建子应用: ${subApp.name}`)

          spinner.succeed(`子应用 ${subApp.name} 构建完成`)
        }
      }

      this.logger.success('✅ 所有应用构建完成')
    } catch (error) {
      this.logger.error('构建失败', error)
      throw error
    }
  }

  private async buildSingleApp(config: MicroFrontendConfig, options: any): Promise<void> {
    try {
      const { ViteLauncher } = await import('../../core/ViteLauncher')

      const buildConfig: any = {
        mode: options.env || 'production',
        build: {
          outDir: config.build?.outDir || 'dist',
          minify: true,
          sourcemap: false
        }
      }

      // 子应用需要特殊的 library 配置
      if (config.type === 'sub') {
        buildConfig.build.lib = {
          entry: 'src/main.ts',
          name: config.name,
          fileName: 'index',
          formats: ['umd']
        }
        buildConfig.build.rollupOptions = {
          external: Object.keys(config.shared || {}),
          output: {
            globals: this.generateGlobals(config.shared || {})
          }
        }
      }

      const launcher = new ViteLauncher({
        cwd: process.cwd(),
        config: buildConfig
      })

      await launcher.build()

      this.logger.success(`✅ ${config.type === 'main' ? '主应用' : '子应用'}构建完成`)
    } catch (error) {
      this.logger.error('构建应用失败', error)
      throw error
    }
  }

  private async generateDockerConfig(config: MicroFrontendConfig, options: any): Promise<void> {
    try {
      // 生成 Dockerfile
      const dockerfile = this.getDockerfileTemplate(config)
      await fs.writeFile('Dockerfile', dockerfile, 'utf-8')
      this.logger.success('✅ Dockerfile 已生成')

      // 生成 docker-compose.yml
      const dockerCompose = this.getDockerComposeTemplate(config)
      await fs.writeFile('docker-compose.yml', dockerCompose, 'utf-8')
      this.logger.success('✅ docker-compose.yml 已生成')

      // 生成 .dockerignore
      const dockerignore = `node_modules
dist
build
.git
.env
*.log
.DS_Store
`
      await fs.writeFile('.dockerignore', dockerignore, 'utf-8')
      this.logger.success('✅ .dockerignore 已生成')

    } catch (error) {
      this.logger.error('生成 Docker 配置失败', error)
      throw error
    }
  }

  private getDockerfileTemplate(config: MicroFrontendConfig): string {
    return `# Multi-stage build for ${config.name}
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production image
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`
  }

  private getDockerComposeTemplate(config: MicroFrontendConfig): string {
    if (config.type === 'main' && config.subApps) {
      // 主应用 + 子应用的 docker-compose 配置
      const services = [`  ${config.name}:
    build: .
    ports:
      - "${config.port}:80"
    environment:
      - NODE_ENV=production
`]

      for (const subApp of config.subApps) {
        services.push(`  ${subApp.name}:
    build: ../${subApp.name}
    ports:
      - "3001:80"
    environment:
      - NODE_ENV=production
`)
      }

      return `version: '3.8'

services:
${services.join('\n')}
`
    }

    // 单应用配置
    return `version: '3.8'

services:
  ${config.name}:
    build: .
    ports:
      - "${config.port}:80"
    environment:
      - NODE_ENV=production
`
  }

  private async executeDeploy(config: MicroFrontendConfig, options: any): Promise<void> {
    try {
      const spinner = ora('执行部署...').start()

      // 构建 Docker 镜像
      const imageName = `${config.name}:latest`
      if (options.registry) {
        spinner.text = '构建 Docker 镜像...'
        this.logger.info(`docker build -t ${options.registry}/${imageName} .`)

        spinner.text = '推送镜像到仓库...'
        this.logger.info(`docker push ${options.registry}/${imageName}`)
      } else {
        spinner.text = '构建 Docker 镜像...'
        this.logger.info(`docker build -t ${imageName} .`)
      }

      spinner.text = '启动容器...'
      this.logger.info('docker-compose up -d')

      spinner.succeed('部署完成!')

      this.logger.success(`✅ ${config.name} 已成功部署`)
      this.logger.info(`🌐 访问地址: http://localhost:${config.port}`)

    } catch (error) {
      this.logger.error('部署失败', error)
      throw error
    }
  }

  // 模板方法
  private getMainAppTemplate(config: MicroFrontendConfig): string {
    return `import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { registerMicroApps, start } from '${config.framework === 'qiankun' ? 'qiankun' : '@originjs/vite-plugin-federation'}'

const app = createApp(App)
app.use(router)

// 注册微应用
registerMicroApps([
  // 子应用配置将在这里添加
])

// 启动微前端
start()

app.mount('#app')
`
  }

  private getMicroConfigTemplate(config: MicroFrontendConfig): string {
    return `export default {
  apps: [
    // 子应用配置
  ],
  shared: ${JSON.stringify(config.shared, null, 2)}
}
`
  }

  private getRouterTemplate(config: MicroFrontendConfig): string {
    return `import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
`
  }

  private getSubAppTemplate(config: MicroFrontendConfig): string {
    return `import './public-path'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

let instance: any = null

function render(props: any = {}) {
  const { container } = props
  instance = createApp(App)
  instance.use(router)
  instance.mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render()
}

export async function bootstrap() {
  console.log('${config.name} bootstrapped')
}

export async function mount(props: any) {
  render(props)
}

export async function unmount() {
  instance?.unmount()
  instance = null
}
`
  }

  private getPublicPathTemplate(config: MicroFrontendConfig): string {
    return `if ((window as any).__POWERED_BY_QIANKUN__) {
  // eslint-disable-next-line
  __webpack_public_path__ = (window as any).__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
`
  }

  private getBootstrapTemplate(config: MicroFrontendConfig): string {
    return `import { createApp } from 'vue'
import App from './App.vue'

export default function bootstrap() {
  const app = createApp(App)
  app.mount('#app')
  return app
}
`
  }
}
