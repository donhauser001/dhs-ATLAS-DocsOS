/**
 * KanbanSwimlaneRenderer - 泳道式看板渲染器
 * 
 * 双维度分组：水平泳道（如优先级）+ 垂直列（如状态）
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { getStatusColor } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import { parseKanbanSwimlaneData, type KanbanSwimlane, type KanbanColumn } from './types';
import { KanbanCard } from './KanbanCard';

// ============================================================
// 子组件
// ============================================================

interface SwimlaneHeaderProps {
    swimlane: KanbanSwimlane;
    totalItems: number;
    isCollapsed: boolean;
    onToggle: () => void;
}

function SwimlaneHeader({ swimlane, totalItems, isCollapsed, onToggle }: SwimlaneHeaderProps) {
    const colors = getStatusColor(swimlane.color);
    
    return (
        <button
            onClick={onToggle}
            className="flex items-center gap-2 w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-left"
        >
            {isCollapsed ? (
                <ChevronRight size={16} className="text-slate-500" />
            ) : (
                <ChevronDown size={16} className="text-slate-500" />
            )}
            <span className={`w-3 h-3 rounded ${colors.bg}`} />
            <span className="font-medium text-slate-700">{swimlane.label}</span>
            <span className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded">
                {totalItems}
            </span>
        </button>
    );
}

interface ColumnHeaderProps {
    column: KanbanColumn;
}

function ColumnHeader({ column }: ColumnHeaderProps) {
    const colors = getStatusColor(column.color);
    
    return (
        <div className="flex items-center gap-2 mb-2 px-1">
            <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
            <span className="text-xs font-medium text-slate-600">{column.label}</span>
            <span className="text-xs text-slate-400">
                {column.items.length}
            </span>
        </div>
    );
}

interface SwimlaneRowProps {
    swimlane: KanbanSwimlane;
    schema: AtlasDataBlock['schema'];
    isCollapsed: boolean;
}

function SwimlaneRow({ swimlane, schema, isCollapsed }: SwimlaneRowProps) {
    if (isCollapsed) return null;
    
    return (
        <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
            {swimlane.columns.map(column => (
                <div key={column.id} className="flex-shrink-0 w-56 bg-slate-50/50 rounded-lg p-2">
                    <ColumnHeader column={column} />
                    
                    <div className="space-y-2 min-h-[100px]">
                        {column.items.map(item => (
                            <KanbanCard
                                key={item.id}
                                item={item}
                                schema={schema}
                                onClick={() => console.log('Card clicked:', item.id)}
                            />
                        ))}
                        
                        {column.items.length === 0 && (
                            <div className="flex items-center justify-center h-16 border border-dashed border-slate-200 rounded text-slate-300 text-xs">
                                空
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function KanbanSwimlaneRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(new Set());
    
    // 解析 atlas-data 代码块
    const dataBlock = useMemo(() => {
        return parseFirstAtlasDataBlock(bodyContent);
    }, [bodyContent]);
    
    // 解析泳道数据
    const swimlanes = useMemo(() => {
        if (!dataBlock) return [];
        const extendedBlock = dataBlock as AtlasDataBlock & { groupBy?: string; swimlaneBy?: string };
        const groupBy = extendedBlock.groupBy || 'status';
        const swimlaneBy = extendedBlock.swimlaneBy || 'priority';
        return parseKanbanSwimlaneData(dataBlock, groupBy, swimlaneBy);
    }, [dataBlock]);
    
    const toggleSwimlane = (swimlaneId: string) => {
        setCollapsedSwimlanes(prev => {
            const next = new Set(prev);
            if (next.has(swimlaneId)) {
                next.delete(swimlaneId);
            } else {
                next.add(swimlaneId);
            }
            return next;
        });
    };
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    const { schema, data } = dataBlock;
    const totalItems = data.length;
    
    // 获取列头信息
    const extendedBlock = dataBlock as AtlasDataBlock & { groupBy?: string };
    const groupBy = extendedBlock.groupBy || 'status';
    const groupSchema = schema.find(f => f.key === groupBy);
    
    return (
        <div className={`w-full px-8 py-6 ${className || ''}`}>
            {/* 统计信息 */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-500">
                    共 <span className="font-medium text-slate-700">{totalItems}</span> 个任务，
                    分布在 <span className="font-medium text-slate-700">{swimlanes.length}</span> 个优先级
                </div>
            </div>
            
            {/* 列头 */}
            {groupSchema?.options && (
                <div className="flex gap-3 mb-4 pl-[140px]">
                    {groupSchema.options.map(opt => {
                        const colors = getStatusColor(opt.color);
                        return (
                            <div key={opt.value} className="flex-shrink-0 w-56 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                                    <span className="text-sm font-medium text-slate-600">{opt.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* 泳道 */}
            <div className="space-y-4">
                {swimlanes.map(swimlane => {
                    const totalInSwimlane = swimlane.columns.reduce((sum, col) => sum + col.items.length, 0);
                    const isCollapsed = collapsedSwimlanes.has(swimlane.id);
                    
                    return (
                        <div key={swimlane.id} className="bg-white rounded-xl border border-slate-200 p-3">
                            <SwimlaneHeader
                                swimlane={swimlane}
                                totalItems={totalInSwimlane}
                                isCollapsed={isCollapsed}
                                onToggle={() => toggleSwimlane(swimlane.id)}
                            />
                            <SwimlaneRow
                                swimlane={swimlane}
                                schema={schema}
                                isCollapsed={isCollapsed}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default KanbanSwimlaneRenderer;

