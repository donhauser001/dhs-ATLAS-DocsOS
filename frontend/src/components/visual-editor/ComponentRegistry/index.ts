/**
 * ComponentRegistry - 组件注册系统
 * 
 * 插件化组件架构：
 * - 每个组件一个独立目录
 * - 自动扫描并注册组件
 * - 新增组件只需添加目录，无需修改框架代码
 * 
 * 使用方式：
 * ```typescript
 * import { 
 *   ComponentControl, 
 *   ComponentConfigurator,
 *   getComponentMetas 
 * } from '@/components/visual-editor/ComponentRegistry';
 * 
 * // 使用统一控件组件（自动路由到对应类型）
 * <ComponentControl component={def} value={val} onChange={setVal} />
 * 
 * // 使用配置器弹窗（自动渲染对应类型配置）
 * <ComponentConfigurator component={null} existingIds={[]} onSave={save} onClose={close} />
 * ```
 */

// 类型导出
export * from './types';

// 注册中心 API
export {
    getRegistry,
    getComponentTypes,
    getComponentMetas,
    getComponent,
    getComponentMeta,
    getControl,
    getConfigurator,
    createDefaultComponent,
    isRegistered,
    registerComponent,
    unregisterComponent,
    registrySize,
} from './registry';

// 共享工具
export {
    OptionEditor,
    FallbackControl,
    generateComponentId,
    getLucideIcon,
    FILE_TYPE_PRESETS,
    IMAGE_EXTENSIONS,
} from './shared';

// 统一组件入口（推荐使用）
export { ComponentControl, type ComponentControlProps } from './ComponentControl';
export { ComponentConfigurator, type ComponentConfiguratorProps } from './ComponentConfigurator';

