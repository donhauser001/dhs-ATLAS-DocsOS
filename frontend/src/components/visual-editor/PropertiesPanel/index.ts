/**
 * 属性面板组件导出
 */

// 主组件
export { PropertiesPanel } from './PropertiesPanel';

// 子组件
export { SortablePropertyRow } from './SortablePropertyRow';
export { SortableCustomProperty } from './SortableCustomProperty';
export { SystemPropertiesSection } from './SystemPropertiesSection';
export { CustomPropertiesSection } from './CustomPropertiesSection';
export { AddPropertyDialog } from './AddPropertyDialog';

// 类型
export type {
    PropertiesPanelProps,
    SortablePropertyRowProps,
    SortableCustomPropertyProps,
    SystemPropertyConfig,
} from './types';
export type { SystemPropertyValues, SystemPropertiesSectionProps } from './SystemPropertiesSection';
export type { CustomPropertiesSectionProps } from './CustomPropertiesSection';

// 工具函数和配置
export {
    COLOR_CLASSES,
    DEFAULT_TAG_COLORS,
    DEFAULT_SYSTEM_ORDER,
    getColorClasses,
    getDefaultTagColor,
    formatDateDisplay,
    getComponentIcon,
    getLucideIcon,
} from './utils';
export { systemPropertiesConfig } from './system-config';
