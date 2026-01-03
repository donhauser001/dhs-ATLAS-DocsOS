/**
 * 文档组件系统 - 类型定义
 * 
 * 组件是文档内定义的可复用输入控件，用于数据块字段的结构化编辑
 * 组件定义存储在文档 frontmatter 的 _components 字段中
 */

// ============================================================
// 组件类型枚举
// ============================================================

export type DocumentComponentType =
    | 'select'       // 下拉选择
    | 'multi-select' // 多选下拉
    | 'radio'        // 单选框组
    | 'checkbox'     // 多选框组
    | 'rating'       // 星级评分
    | 'number'       // 数字输入
    | 'date'         // 日期选择
    | 'text'         // 单行文本
    | 'textarea'     // 多行文本
    | 'file'         // 单文件选择
    | 'files'        // 多文件选择
    | 'image'        // 单图片选择
    | 'images';      // 多图片选择

// ============================================================
// 选项定义
// ============================================================

/**
 * 组件选项
 * 
 * 简化设计：文档系统中，选项值就是显示名称，无需 key/label 分离
 * 存储的值就是用户看到的值，对人和 AI 都更友好
 */
export interface ComponentOption {
    /** 选项值（同时也是显示名称） */
    value: string;
    /** 选项颜色（可选） */
    color?: string;
    /** 选项图标（可选） */
    icon?: string;
}

// ============================================================
// 组件定义
// ============================================================

/** 基础组件定义 */
export interface BaseComponentDefinition {
    /** 组件 ID（在文档内唯一） */
    id: string;
    /** 组件类型 */
    type: DocumentComponentType;
    /** 显示标签 */
    label: string;
    /** 描述（可选） */
    description?: string;
    /** 默认值 */
    default?: unknown;
    /** 是否必填 */
    required?: boolean;
}

/** 选择类组件（select, multi-select, radio, checkbox） */
export interface SelectComponentDefinition extends BaseComponentDefinition {
    type: 'select' | 'multi-select' | 'radio' | 'checkbox';
    /** 选项列表 */
    options: ComponentOption[];
    /** 多选时的最大选择数（仅 multi-select, checkbox） */
    maxSelect?: number;
    /** 占位文本 */
    placeholder?: string;
}

/** 评分组件 */
export interface RatingComponentDefinition extends BaseComponentDefinition {
    type: 'rating';
    /** 最大评分 */
    max?: number;
    /** 是否允许半星 */
    allowHalf?: boolean;
}

/** 数字组件 */
export interface NumberComponentDefinition extends BaseComponentDefinition {
    type: 'number';
    /** 最小值 */
    min?: number;
    /** 最大值 */
    max?: number;
    /** 步进值 */
    step?: number;
    /** 单位 */
    unit?: string;
}

/** 日期组件 */
export interface DateComponentDefinition extends BaseComponentDefinition {
    type: 'date';
    /** 日期格式 */
    format?: string;
    /** 是否包含时间 */
    includeTime?: boolean;
}

/** 文本组件 */
export interface TextComponentDefinition extends BaseComponentDefinition {
    type: 'text';
    /** 占位文本 */
    placeholder?: string;
    /** 最大长度 */
    maxLength?: number;
}

/** 多行文本组件 */
export interface TextareaComponentDefinition extends BaseComponentDefinition {
    type: 'textarea';
    /** 占位文本 */
    placeholder?: string;
    /** 行数 */
    rows?: number;
    /** 最大长度 */
    maxLength?: number;
}

/** 文件组件 */
export interface FileComponentDefinition extends BaseComponentDefinition {
    type: 'file';
    /** 允许的文件扩展名（如 ['.pdf', '.doc']），空表示全部 */
    accept?: string[];
    /** 最大文件大小（MB） */
    maxSize?: number;
}

/** 多文件组件 */
export interface FilesComponentDefinition extends BaseComponentDefinition {
    type: 'files';
    /** 允许的文件扩展名 */
    accept?: string[];
    /** 最大文件数量 */
    maxCount?: number;
    /** 最大单文件大小（MB） */
    maxSize?: number;
}

/** 图片组件 */
export interface ImageComponentDefinition extends BaseComponentDefinition {
    type: 'image';
    /** 允许的图片格式（默认常见图片格式） */
    accept?: string[];
    /** 最大文件大小（MB） */
    maxSize?: number;
}

/** 多图片组件 */
export interface ImagesComponentDefinition extends BaseComponentDefinition {
    type: 'images';
    /** 允许的图片格式 */
    accept?: string[];
    /** 最大图片数量 */
    maxCount?: number;
    /** 最大单文件大小（MB） */
    maxSize?: number;
}

/** 组件定义联合类型 */
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
// 组件存储结构（在 frontmatter 中）
// ============================================================

/** 文档的组件配置 */
export interface DocumentComponentsConfig {
    /** 组件定义映射 */
    _components?: Record<string, DocumentComponentDefinition>;
    /** 字段-组件绑定映射 */
    _field_components?: Record<string, string>;
}

// ============================================================
// 组件类型元数据
// ============================================================

export interface ComponentTypeMeta {
    /** 类型 ID */
    type: DocumentComponentType;
    /** 显示名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 图标（Lucide） */
    icon: string;
    /** 是否需要选项配置 */
    hasOptions: boolean;
}

/** 所有组件类型的元数据 */
export const COMPONENT_TYPE_META: ComponentTypeMeta[] = [
    {
        type: 'select',
        name: '下拉选择',
        description: '单选下拉菜单',
        icon: 'chevron-down',
        hasOptions: true,
    },
    {
        type: 'multi-select',
        name: '多选下拉',
        description: '可多选的下拉菜单',
        icon: 'list-checks',
        hasOptions: true,
    },
    {
        type: 'radio',
        name: '单选框',
        description: '单选框组',
        icon: 'circle-dot',
        hasOptions: true,
    },
    {
        type: 'checkbox',
        name: '多选框',
        description: '多选框组',
        icon: 'check-square',
        hasOptions: true,
    },
    {
        type: 'rating',
        name: '星级评分',
        description: '1-5 星评分',
        icon: 'star',
        hasOptions: false,
    },
    {
        type: 'number',
        name: '数字输入',
        description: '数字输入框',
        icon: 'hash',
        hasOptions: false,
    },
    {
        type: 'date',
        name: '日期选择',
        description: '日期选择器',
        icon: 'calendar',
        hasOptions: false,
    },
    {
        type: 'text',
        name: '单行文本',
        description: '单行文本输入',
        icon: 'type',
        hasOptions: false,
    },
    {
        type: 'textarea',
        name: '多行文本',
        description: '多行文本输入',
        icon: 'align-left',
        hasOptions: false,
    },
    {
        type: 'file',
        name: '文件选择',
        description: '选择单个文件',
        icon: 'file',
        hasOptions: false,
    },
    {
        type: 'files',
        name: '多文件选择',
        description: '选择多个文件',
        icon: 'files',
        hasOptions: false,
    },
    {
        type: 'image',
        name: '图片选择',
        description: '选择单张图片',
        icon: 'image',
        hasOptions: false,
    },
    {
        type: 'images',
        name: '多图片选择',
        description: '选择多张图片',
        icon: 'gallery-horizontal',
        hasOptions: false,
    },
];

/** 根据类型获取元数据 */
export function getComponentTypeMeta(type: DocumentComponentType): ComponentTypeMeta | undefined {
    return COMPONENT_TYPE_META.find(meta => meta.type === type);
}

/** 创建默认组件定义 */
export function createDefaultComponentDefinition(
    type: DocumentComponentType,
    id: string
): DocumentComponentDefinition {
    const base = {
        id,
        type,
        label: getComponentTypeMeta(type)?.name || '新组件',
    };

    switch (type) {
        case 'select':
        case 'multi-select':
        case 'radio':
        case 'checkbox':
            return {
                ...base,
                type,
                options: [
                    { value: '选项 1' },
                    { value: '选项 2' },
                ],
            } as SelectComponentDefinition;

        case 'rating':
            return {
                ...base,
                type: 'rating',
                max: 5,
            } as RatingComponentDefinition;

        case 'number':
            return {
                ...base,
                type: 'number',
                min: 0,
                step: 1,
            } as NumberComponentDefinition;

        case 'date':
            return {
                ...base,
                type: 'date',
                format: 'YYYY-MM-DD',
            } as DateComponentDefinition;

        case 'text':
            return {
                ...base,
                type: 'text',
                placeholder: '请输入...',
            } as TextComponentDefinition;

        case 'textarea':
            return {
                ...base,
                type: 'textarea',
                rows: 3,
                placeholder: '请输入...',
            } as TextareaComponentDefinition;

        case 'file':
            return {
                ...base,
                type: 'file',
                maxSize: 10,
            } as FileComponentDefinition;

        case 'files':
            return {
                ...base,
                type: 'files',
                maxCount: 10,
                maxSize: 10,
            } as FilesComponentDefinition;

        case 'image':
            return {
                ...base,
                type: 'image',
                accept: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
                maxSize: 5,
            } as ImageComponentDefinition;

        case 'images':
            return {
                ...base,
                type: 'images',
                accept: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
                maxCount: 10,
                maxSize: 5,
            } as ImagesComponentDefinition;

        default:
            return base as DocumentComponentDefinition;
    }
}

