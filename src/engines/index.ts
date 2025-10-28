/**
 * 构建引擎模块统一导出
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

// 导出基类
export * from './base'

// 导出 Vite 引擎
export * from './vite'

// 导出引擎元数据
import type { EngineMetadata } from '../types/engine'

/**
 * Vite 引擎元数据
 */
export const VITE_ENGINE_METADATA: EngineMetadata = {
  name: 'vite',
  version: '5.0.0',
  description: 'Vite - 下一代前端构建工具',
  isDefault: true,
  dependencies: ['vite'],
  features: {
    hmr: true,
    ssr: true,
    codeSplitting: true,
    treeShaking: true
  }
}

/**
 * 初始化并注册所有引擎
 */
export async function registerAllEngines(): Promise<void> {
  const { registerEngine } = await import('../registry/EngineRegistry')
  const { createViteEngineFactory } = await import('./vite')

  // 注册 Vite 引擎（默认引擎）
  registerEngine(
    'vite',
    createViteEngineFactory(),
    VITE_ENGINE_METADATA,
    true // 设为默认引擎
  )
}

