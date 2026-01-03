/**
 * ComponentRegistry - 类型定义
 * 
 * 定义组件注册系统的所有类型
 */

import { ReactNode } from 'react';

// ============================================================
// 基础类型
// ============================================================

/** 组件选项 */
export interface ComponentOption {
    value: string;
}

/** 组件类型 */
export type ComponentType =
    | 'select'
    | 'multi-select'
    | 'radio'
    | 'checkbox'
    | 'rating'
    | 'number'
    | 'date'
    | 'text'
    | 'textarea'
    | 'file'
    | 'files'
    | 'image'
    | 'images';

// ============================================================
// 组件定义类型
// ============================================================

/** 基础组件定义 */
export interface BaseComponentDefinition {
    type: ComponentType;
    id: string;
    label: string;
    description?: string;
}

/** 选择类组件定义 */
export interface SelectComponentDefinition extends BaseComponentDefinition {
    type: 'select' | 'multi-select' | 'radio' | 'checkbox';
    options: ComponentOption[];
    maxSelect?: number;
}

/** 评分组件定义 */
export interface RatingComponentDefinition extends BaseComponentDefinition {
    type: 'rating';
    max?: number;
    allowHalf?: boolean;
}

/** 数字组件定义 */
export interface NumberComponentDefinition extends BaseComponentDefinition {
    type: 'number';
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

/** 日期组件定义 */
export interface DateComponentDefinition extends BaseComponentDefinition {
    type: 'date';
    format?: string;
    includeTime?: boolean;
}

/** 文本组件定义 */
export interface TextComponentDefinition extends BaseComponentDefinition {
    type: 'text';
    placeholder?: string;
    maxLength?: number;
}

/** 多行文本组件定义 */
export interface TextareaComponentDefinition extends BaseComponentDefinition {
    type: 'textarea';
    placeholder?: string;
    rows?: number;
    maxLength?: number;
}

/** 文件组件定义 */
export interface FileComponentDefinition extends BaseComponentDefinition {
    type: 'file';
    accept?: string[];
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 多文件组件定义 */
export interface FilesComponentDefinition extends BaseComponentDefinition {
    type: 'files';
    accept?: string[];
    maxCount?: number;
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 图片组件定义 */
export interface ImageComponentDefinition extends BaseComponentDefinition {
    type: 'image';
    accept?: string[];
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 多图片组件定义 */
export interface ImagesComponentDefinition extends BaseComponentDefinition {
    type: 'images';
    accept?: string[];
    maxCount?: number;
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 文档组件定义联合类型 */
export type DocumentComponentDefinition =
    | SelectComponentDefinition
    | RatingComponentDefinition
    | NumberComponentDefinition
    | DateComponentDefinition
    | TextComponentDefinition
    | TextareaComponentDefinition
    | FileComponentDefinition
    | FilesComponentDefinition
    | ImageComponentDefinition
    | ImagesComponentDefinition;

// ============================================================
// 组件控件 Props
// ============================================================

/** 控件基础 Props */
export interface ControlProps {
    /** 组件定义 */
    component: DocumentComponentDefinition;
    /** 当前值 */
    value: string | string[] | number | null | undefined;
    /** 值变更回调 */
    onChange: (value: string | string[] | number | null) => void;
    /** 是否禁用 */
    disabled?: boolean;
}

/** 配置器基础 Props */
export interface ConfiguratorProps {
    /** 组件定义 */
    formData: DocumentComponentDefinition;
    /** 错误信息 */
    errors: Record<string, string>;
    /** 更新表单数据 */
    onUpdateFormData: (updater: (prev: DocumentComponentDefinition) => DocumentComponentDefinition) => void;
}

// ============================================================
// 组件注册类型
// ============================================================

/** 组件元数据配置 */
export interface ComponentMeta {
    /** 组件类型 */
    type: ComponentType;
    /** 显示名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 图标名称 (Lucide icon) */
    icon: string;
    /** 是否有选项 */
    hasOptions: boolean;
}

/** 组件注册定义 */
export interface RegisteredComponent {
    /** 组件元数据 */
    meta: ComponentMeta;
    /** 创建默认组件定义 */
    createDefault: (id: string) => DocumentComponentDefinition;
    /** 数据块中的控件组件 */
    Control: React.ComponentType<ControlProps>;
    /** 配置弹窗中的配置表单 */
    Configurator: React.ComponentType<ConfiguratorProps>;
}

/** 组件注册表类型 */
export type ComponentRegistry = Map<ComponentType, RegisteredComponent>;

// ============================================================
// 降级控件 Props
// ============================================================

/** 降级控件 Props */
export interface FallbackControlProps {
    componentId: string;
    value: string | string[] | number | null | undefined;
    onChange: (value: string | null) => void;
}

