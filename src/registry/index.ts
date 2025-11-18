/**
 * 注册中心模块统一导出
 *
 * @author LDesign Team
 * @since 2.0.0
 */

export {
  createEngine,
  EngineRegistry,
  getEngineRegistry,
  registerEngine,
} from './EngineRegistry'

export {
  createFrameworkAdapter,
  detectFramework,
  FrameworkRegistry,
  getFrameworkRegistry,
  registerFramework,
} from './FrameworkRegistry'
