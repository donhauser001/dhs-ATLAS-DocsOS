/**
 * 块式编辑器类型定义
 */

export type BlockType =
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'paragraph'
    | 'code'
    | 'quote'
    | 'list'
    | 'divider'
    | 'yaml'
    | 'file';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
    /** 代码块语言 */
    language?: string;
    /** 列表项（用于列表类型） */
    items?: string[];
    /** YAML 原始内容 */
    yaml?: string;
    /** 文件引用（用于文件类型） */
    fileRef?: {
        path: string;
        name: string;
        size?: number;
        mimeType?: string;
        extension?: string;
    };
}

export interface BlockTypeOption {
    type: BlockType;
    label: string;
    icon: string;
    shortcut?: string;
}

export const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
    { type: 'paragraph', label: '段落', icon: 'Type', shortcut: 'Ctrl+0' },
    { type: 'heading1', label: '一级标题', icon: 'Heading1', shortcut: 'Ctrl+1' },
    { type: 'heading2', label: '二级标题', icon: 'Heading2', shortcut: 'Ctrl+2' },
    { type: 'heading3', label: '三级标题', icon: 'Heading3', shortcut: 'Ctrl+3' },
    { type: 'quote', label: '引用', icon: 'Quote', shortcut: 'Ctrl+Q' },
    { type: 'code', label: '代码块', icon: 'Code', shortcut: 'Ctrl+E' },
    { type: 'yaml', label: '数据', icon: 'Database', shortcut: 'Ctrl+D' },
    { type: 'file', label: '文件', icon: 'Paperclip', shortcut: 'Ctrl+F' },
    { type: 'list', label: '列表', icon: 'List', shortcut: 'Ctrl+L' },
    { type: 'divider', label: '分隔线', icon: 'Minus' },
];

/**
 * 数据块固定字段 - 每个数据块必须包含这些字段，不可删除
 */
export interface DataBlockFixedField {
    /** 字段 key */
    key: string;
    /** 默认值（函数用于生成动态值） */
    defaultValue: string | (() => string);
    /** 是否必填 */
    required: boolean;
}

export const DATA_BLOCK_FIXED_FIELDS: DataBlockFixedField[] = [
    { key: 'type', defaultValue: 'data', required: true },
    { key: 'id', defaultValue: () => `data-${Date.now().toString(36)}`, required: true },
    { key: 'status', defaultValue: 'draft', required: true },
    { key: 'title', defaultValue: '', required: true },
    { key: 'createdAt', defaultValue: () => new Date().toISOString().split('T')[0], required: true },
    { key: 'updatedAt', defaultValue: () => new Date().toISOString().split('T')[0], required: true },
];

/**
 * 获取固定字段的 key 集合
 */
export const FIXED_FIELD_KEYS = new Set(DATA_BLOCK_FIXED_FIELDS.map(f => f.key));

/**
 * 生成数据块默认 YAML 内容
 */
export function generateDefaultDataBlockContent(): string {
    const data: Record<string, string> = {};
    for (const field of DATA_BLOCK_FIXED_FIELDS) {
        data[field.key] = typeof field.defaultValue === 'function'
            ? field.defaultValue()
            : field.defaultValue;
    }
    // 手动格式化，保持字段顺序
    return DATA_BLOCK_FIXED_FIELDS
        .map(f => `${f.key}: ${data[f.key] || '""'}`)
        .join('\n');
}

