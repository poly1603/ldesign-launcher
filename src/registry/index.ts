/**
 * 注册中心模块统一导出
 * 
 * @author LDesign Team
 * @since 2.0.0
 */

export {
  EngineRegistry,
  getEngineRegistry,
  registerEngine,
  createEngine
} from './EngineRegistry'

export {
  FrameworkRegistry,
  getFrameworkRegistry,
  registerFramework,
  createFrameworkAdapter,
  detectFramework
} from './FrameworkRegistry'

