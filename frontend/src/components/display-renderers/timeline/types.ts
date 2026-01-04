/**
 * 时间线视图类型定义
 */

import type { AtlasDataBlock, DataItem, FieldSchema, SelectOption } from '../list/types';

/**
 * 时间线事件
 */
export interface TimelineEvent {
    id: string;
    title: string;
    date: Date;
    endDate?: Date;
    type?: string;
    typeOption?: SelectOption;
    description?: string;
    team?: string[];
    progress?: number;
    raw: DataItem;
}

/**
 * 时间线数据块
 */
export interface TimelineDataBlock extends AtlasDataBlock {
    dateField: string;
    endDateField?: string;
}

/**
 * 解析时间线数据
 */
export function parseTimelineData(
    dataBlock: AtlasDataBlock,
    dateField: string = 'date',
    endDateField?: string
): TimelineEvent[] {
    const { schema, data } = dataBlock;
    
    // 找到类型字段的 schema
    const typeSchema = schema.find(f => f.type === 'select' && f.key === 'type');
    const titleField = schema.find(f => f.type === 'text' && f.key !== 'assignee');
    const descField = schema.find(f => f.type === 'textarea');
    const teamField = schema.find(f => f.type === 'tags');
    const progressField = schema.find(f => f.type === 'number' && f.key === 'progress');
    
    const events: TimelineEvent[] = data
        .filter(item => item[dateField]) // 只处理有日期的项
        .map(item => {
            const dateStr = String(item[dateField]);
            const endDateStr = endDateField ? String(item[endDateField] || '') : '';
            const typeValue = item['type'] as string;
            const typeOption = typeSchema?.options?.find(opt => opt.value === typeValue);
            
            return {
                id: item.id,
                title: titleField ? String(item[titleField.key] || '未命名') : '未命名',
                date: new Date(dateStr),
                endDate: endDateStr ? new Date(endDateStr) : undefined,
                type: typeValue,
                typeOption,
                description: descField ? String(item[descField.key] || '') : undefined,
                team: teamField ? (item[teamField.key] as string[]) : undefined,
                progress: progressField ? (item[progressField.key] as number) : undefined,
                raw: item,
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // 按日期排序
    
    return events;
}

/**
 * 格式化日期
 */
export function formatTimelineDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * 格式化月份
 */
export function formatMonth(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
    });
}

/**
 * 获取类型图标
 */
export function getTypeIcon(type?: string): string {
    const iconMap: Record<string, string> = {
        milestone: '🏁',
        release: '🚀',
        event: '📅',
        decision: '💡',
    };
    return iconMap[type || ''] || '📌';
}

