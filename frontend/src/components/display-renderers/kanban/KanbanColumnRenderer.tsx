/**
 * KanbanColumnRenderer - 列式看板渲染器
 * 
 * 按状态分列显示任务卡片
 */

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { getStatusColor } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import { parseKanbanData, type KanbanColumn } from './types';
import { KanbanCard } from './KanbanCard';

// ============================================================
// 子组件
// ============================================================

interface ColumnHeaderProps {
    column: KanbanColumn;
    count: number;
}

function ColumnHeader({ column, count }: ColumnHeaderProps) {
    const colors = getStatusColor(column.color);
    
    return (
        <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                <span className="text-sm font-medium text-slate-700">{column.label}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {count}
                </span>
            </div>
            <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                <Plus size={14} />
            </button>
        </div>
    );
}

interface KanbanColumnComponentProps {
    column: KanbanColumn;
    schema: AtlasDataBlock['schema'];
}

function KanbanColumnComponent({ column, schema }: KanbanColumnComponentProps) {
    const colors = getStatusColor(column.color);
    
    return (
        <div className="flex-shrink-0 w-72 bg-slate-50 rounded-lg p-3">
            <ColumnHeader column={column} count={column.items.length} />
            
            {/* 卡片列表 */}
            <div className="space-y-2 min-h-[200px]">
                {column.items.map(item => (
                    <KanbanCard
                        key={item.id}
                        item={item}
                        schema={schema}
                        onClick={() => console.log('Card clicked:', item.id)}
                    />
                ))}
                
                {/* 空列提示 */}
                {column.items.length === 0 && (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                        暂无任务
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function KanbanColumnRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    // 解析 atlas-data 代码块
    const dataBlock = useMemo(() => {
        return parseFirstAtlasDataBlock(bodyContent);
    }, [bodyContent]);
    
    // 解析看板数据
    const columns = useMemo(() => {
        if (!dataBlock) return [];
        const groupBy = (dataBlock as AtlasDataBlock & { groupBy?: string }).groupBy || 'status';
        return parseKanbanData(dataBlock, groupBy);
    }, [dataBlock]);
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    const { schema, data } = dataBlock;
    
    // 计算统计信息
    const totalItems = data.length;
    
    return (
        <div className={`w-full px-8 py-6 ${className || ''}`}>
            {/* 统计信息 */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-500">
                    共 <span className="font-medium text-slate-700">{totalItems}</span> 个任务，
                    分布在 <span className="font-medium text-slate-700">{columns.length}</span> 个阶段
                </div>
            </div>
            
            {/* 看板列 */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map(column => (
                    <KanbanColumnComponent
                        key={column.id}
                        column={column}
                        schema={schema}
                    />
                ))}
            </div>
        </div>
    );
}

export default KanbanColumnRenderer;

