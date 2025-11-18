/**
 * Launcher 引导模块
 *
 * 负责初始化和注册所有引擎和框架
 *
 * @author LDesign Team
 * @since 2.0.0
 */

import { Logger } from '../utils/logger'

/**
 * 是否已初始化
 */
let initialized = false

/**
 * 初始化 Launcher 系统
 *
 * 注册所有可用的构建引擎和框架适配器
 */
export async function bootstrap(): Promise<void> {
  if (initialized) {
    return
  }

  const logger = new Logger('Bootstrap')
  logger.debug('初始化 Launcher 系统...')

  try {
    // 1. 注册所有构建引擎
    const { registerAllEngines } = await import('../engines')
    await registerAllEngines()
    logger.debug('构建引擎注册完成')

    // 2. 注册所有框架适配器
    const { registerAllFrameworks } = await import('../frameworks')
    await registerAllFrameworks()
    logger.debug('框架适配器注册完成')

    initialized = true
    logger.debug('Launcher 系统初始化完成')
  }
  catch (error) {
    logger.error('Launcher 系统初始化失败', error)
    throw error
  }
}

/**
 * 重置初始化状态（主要用于测试）
 */
export function resetBootstrap(): void {
  initialized = false
}

/**
 * 检查是否已初始化
 */
export function isBootstrapped(): boolean {
  return initialized
}
