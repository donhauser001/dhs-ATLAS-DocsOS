/**
 * 属性面板组件导出
 */

// 主组件
export { PropertiesPanel } from './PropertiesPanel';

// 模式面板组件
export { ReadModePanel } from './ReadModePanel';
export { EditModePanel } from './EditModePanel';
export { MetaInfoRow } from './MetaInfoRow';
export { TechInfoPanel } from './TechInfoPanel';
export type { DocTypeDisplay, FunctionDisplay, DataBlockStructure } from './TechInfoPanel';

// 阅读模式组件
export { DocumentInfoCard } from './DocumentInfoCard';
export type { DocumentInfoCardProps } from './DocumentInfoCard';

// 视图切换器
export { ViewSwitcher, useViewPreference } from './ViewSwitcher';
export type { ViewSwitcherProps } from './ViewSwitcher';

// 子组件
export { SortablePropertyRow } from './SortablePropertyRow';
export { SortableCustomProperty } from './SortableCustomProperty';
export { SystemPropertiesSection } from './SystemPropertiesSection';
export { CustomPropertiesSection } from './CustomPropertiesSection';
export { AddPropertyDialog } from './AddPropertyDialog';
export { TypePackageDisplay, clearTypePackageCache } from './TypePackageDisplay';

// 类型
export type {
    PropertiesPanelProps,
    PropertiesPanelMode,
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
    formatRelativeTime,
    getComponentIcon,
    getLucideIcon,
} from './utils';
export { systemPropertiesConfig } from './system-config';
