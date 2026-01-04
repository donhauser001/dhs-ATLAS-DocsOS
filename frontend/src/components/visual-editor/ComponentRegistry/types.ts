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
    | 'images'
    | 'phone'
    | 'email'
    | 'id-card'
    | 'toggle'
    | 'folder-picker'
    | 'avatar'
    | 'file-list'
    | 'tags'
    | 'id-generator';

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

/** 手机号组件定义 */
export interface PhoneComponentDefinition extends BaseComponentDefinition {
    type: 'phone';
    placeholder?: string;
    /** 国家代码 */
    countryCode?: string;
}

/** 邮箱组件定义 */
export interface EmailComponentDefinition extends BaseComponentDefinition {
    type: 'email';
    placeholder?: string;
}

/** 身份证号组件定义 */
export interface IdCardComponentDefinition extends BaseComponentDefinition {
    type: 'id-card';
    placeholder?: string;
    /** 是否显示遮罩（保护隐私） */
    masked?: boolean;
}

/** 开关组件定义 */
export interface ToggleComponentDefinition extends BaseComponentDefinition {
    type: 'toggle';
    /** 开启时的文案 */
    onLabel?: string;
    /** 关闭时的文案 */
    offLabel?: string;
}

/** 目录选择器组件定义 */
export interface FolderPickerComponentDefinition extends BaseComponentDefinition {
    type: 'folder-picker';
    /** 是否支持多选 */
    multiple?: boolean;
    /** 根目录（限制选择范围） */
    rootPath?: string;
    placeholder?: string;
}

/** 头像组件定义 */
export interface AvatarComponentDefinition extends BaseComponentDefinition {
    type: 'avatar';
    /** 裁切比例 (1:1 为默认) */
    aspectRatio?: number;
    /** 最大尺寸 (KB) */
    maxSize?: number;
    /** 上传目录 */
    directory?: string;
}

/** 文件列表组件定义 */
export interface FileListComponentDefinition extends BaseComponentDefinition {
    type: 'file-list';
    /** 是否允许下载 */
    allowDownload?: boolean;
    /** 是否允许删除 */
    allowDelete?: boolean;
    /** 显示模式: list | grid */
    displayMode?: 'list' | 'grid';
}

/** 标签组件定义 */
export interface TagsComponentDefinition extends BaseComponentDefinition {
    type: 'tags';
    /** 预设标签选项 */
    suggestions?: string[];
    /** 最大标签数量 */
    maxTags?: number;
    /** 是否允许创建新标签 */
    allowCreate?: boolean;
    /** 标签颜色 */
    color?: string;
    placeholder?: string;
}

/** ID生成器组件定义 */
export interface IdGeneratorComponentDefinition extends BaseComponentDefinition {
    type: 'id-generator';
    /** 前缀 */
    prefix?: string;
    /** 后缀 */
    suffix?: string;
    /** ID 长度（不含前缀后缀） */
    length?: number;
    /** 格式: numeric=纯数字, alpha=纯字母, alphanumeric=字母数字混合, uuid=UUID */
    format?: 'numeric' | 'alpha' | 'alphanumeric' | 'uuid' | 'timestamp';
    /** 是否自动生成（创建时自动填充） */
    autoGenerate?: boolean;
    /** 是否允许手动编辑 */
    editable?: boolean;
    /** 是否大写 */
    uppercase?: boolean;
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
    | ImagesComponentDefinition
    | PhoneComponentDefinition
    | EmailComponentDefinition
    | IdCardComponentDefinition
    | ToggleComponentDefinition
    | FolderPickerComponentDefinition
    | AvatarComponentDefinition
    | FileListComponentDefinition
    | TagsComponentDefinition
    | IdGeneratorComponentDefinition;

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

