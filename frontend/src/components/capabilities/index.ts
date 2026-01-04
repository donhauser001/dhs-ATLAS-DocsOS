/**
 * 能力组件入口
 * 
 * 自动注册所有能力组件，并导出注册表和类型
 */

// 导出类型
export * from './types';

// 导出注册表
export { capabilityRegistry, registerCapability, registerCapabilities } from './registry';

// 导出能力操作组件
export { CapabilityActions, CapabilityPanels } from './CapabilityActions';

// 自动注册所有内置能力组件
// 只需要 import 就会自动执行注册
import './crud/CrudCapability';
import './export/ExportCapability';
import './share/ShareCapability';
import './comment/CommentCapability';

