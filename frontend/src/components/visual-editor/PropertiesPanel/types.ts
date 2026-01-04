/**
 * PropertiesPanel 类型定义
 */

import type { PropertyDefinition, PropertyComponentConfig } from '@/types/property';
import type { getComponent } from '@/registry/property-components';

/** 属性面板显示模式 */
export type PropertiesPanelMode = 'read' | 'edit';

export interface PropertiesPanelProps {
    /** 文档 frontmatter */
    frontmatter: Record<string, unknown>;
    /** frontmatter 变更回调 */
    onFrontmatterChange: (frontmatter: Record<string, unknown>) => void;
    /** 是否禁用（编辑模式下禁用编辑） */
    disabled?: boolean;
    /** 是否默认展开 */
    defaultExpanded?: boolean;
    /** 显示模式：read（阅读模式）或 edit（编辑模式） */
    mode?: PropertiesPanelMode;
    /** 模式切换回调 */
    onModeChange?: (mode: PropertiesPanelMode) => void;
    /** 文档路径（用于视图偏好存储） */
    documentPath?: string;
    /** 当前显现模式 */
    displayMode?: string;
    /** 显现模式切换回调 */
    onDisplayModeChange?: (mode: string) => void;
}

export interface SortablePropertyRowProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    type: 'text' | 'date' | 'tags' | 'doc-type' | 'function-type' | 'display-modes' | 'capabilities';
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

