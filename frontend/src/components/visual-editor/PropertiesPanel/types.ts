/**
 * PropertiesPanel 类型定义
 */

import type { PropertyDefinition, PropertyComponentConfig } from '@/types/property';
import type { getComponent } from '@/registry/property-components';

export interface PropertiesPanelProps {
    /** 文档 frontmatter */
    frontmatter: Record<string, unknown>;
    /** frontmatter 变更回调 */
    onFrontmatterChange: (frontmatter: Record<string, unknown>) => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否默认展开 */
    defaultExpanded?: boolean;
}

export interface SortablePropertyRowProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    type: 'text' | 'date' | 'tags';
    value: unknown;
    onChange: (value: unknown) => void;
    readonly?: boolean;
    disabled?: boolean;
    wide?: boolean;
}

export interface SortableCustomPropertyProps {
    definition: PropertyDefinition;
    component: ReturnType<typeof getComponent>;
    value: unknown;
    isEditing: boolean;
    disabled: boolean;
    onValueChange: (value: unknown) => void;
    onToggleConfig: () => void;
    onDelete: () => void;
    onConfigChange: (config: PropertyComponentConfig) => void;
}

/**
 * 系统属性运行时配置（包含从标签系统获取的值）
 */
export interface SystemPropertyConfig {
    label: string;
    icon: React.ReactNode;
    type: string;
    readonly?: boolean;
    wide?: boolean;
}

