/**
 * Atlas Data 解析器
 * 
 * 从 Markdown 内容中解析 ```atlas-data 代码块
 */

import yaml from 'js-yaml';
import type { AtlasDataBlock } from './types';

/**
 * 从 Markdown 内容中提取所有 atlas-data 代码块
 */
export function parseAtlasDataBlocks(content: string): AtlasDataBlock[] {
    const blocks: AtlasDataBlock[] = [];
    
    // 匹配 ```atlas-data ... ``` 代码块
    const regex = /```atlas-data\s*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const yamlContent = match[1].trim();
        try {
            const parsed = yaml.load(yamlContent) as AtlasDataBlock;
            if (parsed && parsed.id && parsed.schema && parsed.data) {
                blocks.push(parsed);
            }
        } catch (error) {
            console.error('Failed to parse atlas-data block:', error);
        }
    }
    
    return blocks;
}

/**
 * 从 Markdown 内容中提取第一个 atlas-data 代码块
 */
export function parseFirstAtlasDataBlock(content: string): AtlasDataBlock | null {
    const blocks = parseAtlasDataBlocks(content);
    return blocks.length > 0 ? blocks[0] : null;
}

/**
 * 从 Markdown 内容中提取指定 ID 的 atlas-data 代码块
 */
export function parseAtlasDataBlockById(content: string, id: string): AtlasDataBlock | null {
    const blocks = parseAtlasDataBlocks(content);
    return blocks.find(block => block.id === id) || null;
}

/**
 * 格式化日期显示
 */
export function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 30) {
            return formatDate(dateStr);
        } else if (days > 0) {
            return `${days} 天前`;
        } else if (hours > 0) {
            return `${hours} 小时前`;
        } else if (minutes > 0) {
            return `${minutes} 分钟前`;
        } else {
            return '刚刚';
        }
    } catch {
        return dateStr;
    }
}

/**
 * 获取字段值的显示文本
 */
export function getFieldDisplayValue(
    value: unknown,
    schema: { type: string; options?: Array<{ value: string; label: string }> }
): string {
    if (value === null || value === undefined) return '—';
    
    switch (schema.type) {
        case 'select':
            if (schema.options) {
                const option = schema.options.find(opt => opt.value === value);
                return option?.label || String(value);
            }
            return String(value);
            
        case 'tags':
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return String(value);
            
        case 'date':
            return formatDate(String(value));
            
        case 'datetime':
            return formatRelativeTime(String(value));
            
        case 'boolean':
            return value ? '是' : '否';
            
        case 'currency':
            if (typeof value === 'number') {
                return new Intl.NumberFormat('zh-CN', {
                    style: 'currency',
                    currency: 'CNY',
                }).format(value);
            }
            return String(value);
            
        case 'number':
            return typeof value === 'number' ? value.toLocaleString() : String(value);
            
        default:
            return String(value);
    }
}

