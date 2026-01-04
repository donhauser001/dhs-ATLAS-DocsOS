import YAML from 'yaml';
import type { FieldSchema, SelectOption } from '../list/types';

// 详情区块类型
export interface DetailSection {
    id: string;
    type: 'detail_section' | 'detail_list';
    title: string;
    icon?: string;
    schema: FieldSchema[];
    data: Record<string, unknown> | Record<string, unknown>[];
}

// 字段值显示
export interface FieldValue {
    key: string;
    label: string;
    type: string;
    value: unknown;
    displayValue: string;
    option?: SelectOption;
    options?: SelectOption[];
}

// 解析详情数据块
export function parseDetailBlocks(bodyContent: string): DetailSection[] {
    const blocks: DetailSection[] = [];
    const regex = /```atlas-data\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(bodyContent)) !== null) {
        try {
            const content = match[1];
            // 使用 yaml 库解析
            const parsed = YAML.parse(content);
            
            if (parsed && (parsed.type === 'detail_section' || parsed.type === 'detail_list')) {
                blocks.push(parsed as DetailSection);
            }
        } catch (e) {
            console.error('Failed to parse detail block:', e);
        }
    }

    return blocks;
}

// 获取字段显示值
export function getFieldDisplayValue(
    schema: FieldSchema,
    value: unknown
): FieldValue {
    const result: FieldValue = {
        key: schema.key,
        label: schema.label,
        type: schema.type,
        value,
        displayValue: '',
        options: schema.options,
    };

    if (value === null || value === undefined || value === '') {
        result.displayValue = '—';
        return result;
    }

    switch (schema.type) {
        case 'select':
            const options = Array.isArray(schema.options) ? schema.options : [];
            const option = options.find(o => o.value === value);
            result.option = option;
            result.displayValue = option?.label || String(value);
            break;
        
        case 'date':
            const date = new Date(value as string);
            result.displayValue = date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            break;
        
        case 'currency':
            const num = Number(value);
            result.displayValue = new Intl.NumberFormat('zh-CN', {
                style: 'currency',
                currency: 'CNY',
            }).format(num);
            break;
        
        case 'url':
        case 'link':
            result.displayValue = String(value);
            break;
        
        case 'email':
            result.displayValue = String(value);
            break;
        
        case 'phone':
            result.displayValue = String(value);
            break;
        
        case 'textarea':
            result.displayValue = String(value);
            break;
        
        default:
            result.displayValue = String(value);
    }

    return result;
}

// 图标映射
export const ICON_MAP: Record<string, string> = {
    building: '🏢',
    phone: '📞',
    briefcase: '💼',
    'clipboard-list': '📋',
    'file-text': '📄',
    user: '👤',
    calendar: '📅',
    mail: '✉️',
    globe: '🌐',
    dollar: '💰',
};

// 获取状态颜色
export function getStatusColor(color?: string): { bg: string; text: string; border: string } {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        gold: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        gray: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    };
    return colors[color || 'gray'] || colors.gray;
}
