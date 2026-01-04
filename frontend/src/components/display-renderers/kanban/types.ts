/**
 * 看板视图类型定义
 */

import type { AtlasDataBlock, DataItem, FieldSchema, SelectOption } from '../list/types';

/**
 * 看板列定义
 */
export interface KanbanColumn {
    id: string;
    label: string;
    color?: string;
    items: DataItem[];
}

/**
 * 看板泳道定义
 */
export interface KanbanSwimlane {
    id: string;
    label: string;
    color?: string;
    columns: KanbanColumn[];
}

/**
 * 看板数据块（扩展自 AtlasDataBlock）
 */
export interface KanbanDataBlock extends AtlasDataBlock {
    groupBy: string;      // 分列字段（如 status）
    swimlaneBy?: string;  // 泳道字段（如 priority）
}

/**
 * 看板卡片 Props
 */
export interface KanbanCardProps {
    item: DataItem;
    schema: FieldSchema[];
    onClick?: () => void;
    onDragStart?: () => void;
}

/**
 * 解析看板数据
 */
export function parseKanbanData(
    dataBlock: AtlasDataBlock,
    groupByField: string
): KanbanColumn[] {
    const { schema, data } = dataBlock;
    
    // 找到分组字段的 schema
    const groupSchema = schema.find(f => f.key === groupByField);
    if (!groupSchema || !groupSchema.options) {
        // 没有找到分组字段或者不是 select 类型，返回空
        return [];
    }
    
    // 创建列
    const columns: KanbanColumn[] = groupSchema.options.map((opt: SelectOption) => ({
        id: opt.value,
        label: opt.label,
        color: opt.color,
        items: [],
    }));
    
    // 将数据分配到各列
    data.forEach(item => {
        const groupValue = item[groupByField] as string;
        const column = columns.find(col => col.id === groupValue);
        if (column) {
            column.items.push(item);
        }
    });
    
    return columns;
}

/**
 * 解析看板泳道数据
 */
export function parseKanbanSwimlaneData(
    dataBlock: AtlasDataBlock,
    groupByField: string,
    swimlaneByField: string
): KanbanSwimlane[] {
    const { schema, data } = dataBlock;
    
    // 找到字段 schema
    const groupSchema = schema.find(f => f.key === groupByField);
    const swimlaneSchema = schema.find(f => f.key === swimlaneByField);
    
    if (!groupSchema?.options || !swimlaneSchema?.options) {
        return [];
    }
    
    // 创建泳道
    const swimlanes: KanbanSwimlane[] = swimlaneSchema.options.map((swimOpt: SelectOption) => ({
        id: swimOpt.value,
        label: swimOpt.label,
        color: swimOpt.color,
        columns: groupSchema.options!.map((colOpt: SelectOption) => ({
            id: colOpt.value,
            label: colOpt.label,
            color: colOpt.color,
            items: [],
        })),
    }));
    
    // 将数据分配到泳道和列
    data.forEach(item => {
        const groupValue = item[groupByField] as string;
        const swimlaneValue = item[swimlaneByField] as string;
        
        const swimlane = swimlanes.find(sl => sl.id === swimlaneValue);
        if (swimlane) {
            const column = swimlane.columns.find(col => col.id === groupValue);
            if (column) {
                column.items.push(item);
            }
        }
    });
    
    return swimlanes;
}

