/**
 * 场景化视图注册表
 */

// 类型导出
export type {
  ViewMode,
  ViewProps,
  ActionConfig,
  FunctionViewConfig,
  ADLDocument,
  ADLBlock,
} from './types';

// 功能视图注册表
export {
  FunctionViewRegistry,
  registerFunctionView,
  getFunctionViewConfig,
  getAvailableModes,
  getDefaultMode,
  getViewComponent,
  getActions,
  getAvailableActions,
  isModeAvailable,
  getRegisteredFunctions,
} from './FunctionViewRegistry';

// 视图模式配置
export {
  ViewModeConfig,
  getViewModeSettings,
  getAvailableViewModes,
  getDefaultViewMode,
  getViewModeLabel,
  isViewModeAvailable,
  getNextViewMode,
} from './ViewModeConfig';

// 视图注册（自动执行）
import './registerViews';

