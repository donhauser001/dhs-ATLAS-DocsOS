/**
 * 列表视图类型定义
 */

/**
 * 字段 Schema 定义
 */
export interface FieldSchema {
    key: string;
    label: string;
    type: 
        | 'text' | 'number' | 'date' | 'datetime' | 'select' | 'tags' | 'textarea' 
        | 'url' | 'email' | 'phone' | 'boolean' | 'currency' | 'image' | 'link' 
        | 'user' | 'reference' | 'avatar' | 'toggle' | 'file' | 'files' | 'rating' 
        | 'user-auth' | 'password' | 'object';
    options?: SelectOption[];
    unit?: string;
    currency?: string;
    max?: number;
    min?: number;
}

/**
 * 选择项定义
 */
export interface SelectOption {
    value: string;
    label: string;
    color?: string;
    icon?: string;
}

/**
 * 数据项
 */
export interface DataItem {
    id: string;
    [key: string]: unknown;
}

/**
 * Atlas 数据块
 */
export interface AtlasDataBlock {
    id: string;
    type: string;
    title?: string;
    icon?: string;
    schema: FieldSchema[];
    data: DataItem[];
    // 列表特有配置
    groupBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    // 看板特有配置
    swimlaneBy?: string;
    // 时间线特有配置
    dateField?: string;
    endDateField?: string;
    // 画廊特有配置
    coverField?: string;
}

/**
 * 列表视图 Props（扩展自 DisplayRendererProps）
 */
export interface ListRendererProps {
    /** 数据块 */
    dataBlock: AtlasDataBlock;
    /** 文档路径 */
    documentPath: string;
    /** 是否只读 */
    readonly?: boolean;
    /** 数据变更回调 */
    onDataChange?: (data: DataItem[]) => void;
    /** 额外的 CSS 类名 */
    className?: string;
}

/**
 * 状态颜色映射
 */
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    gray: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    gold: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
};

/**
 * 获取状态颜色
 */
export function getStatusColor(color?: string) {
    return STATUS_COLORS[color || 'gray'] || STATUS_COLORS.gray;
}

