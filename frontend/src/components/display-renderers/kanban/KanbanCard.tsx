/**
 * KanbanCard - 看板卡片组件
 * 
 * 用于看板视图中的单个任务卡片展示
 */

import { User, Clock, Tag, MoreHorizontal } from 'lucide-react';
import type { DataItem, FieldSchema } from '../list/types';
import { getStatusColor } from '../list/types';

interface KanbanCardProps {
    item: DataItem;
    schema: FieldSchema[];
    onClick?: () => void;
}

export function KanbanCard({ item, schema, onClick }: KanbanCardProps) {
    // 找到主要字段
    const titleField = schema.find(f => f.type === 'text' && f.key !== 'assignee');
    const priorityField = schema.find(f => f.key === 'priority');
    const assigneeField = schema.find(f => f.key === 'assignee' || f.key === 'owner');
    const estimateField = schema.find(f => f.type === 'number');
    const labelsField = schema.find(f => f.type === 'tags' || f.key === 'labels');
    
    const title = titleField ? String(item[titleField.key] || '未命名') : '未命名';
    const priority = priorityField ? item[priorityField.key] as string : undefined;
    const assignee = assigneeField ? String(item[assigneeField.key] || '') : undefined;
    const estimate = estimateField ? item[estimateField.key] as number : undefined;
    const labels = labelsField ? (item[labelsField.key] as string[]) || [] : [];
    
    // 获取优先级颜色
    const priorityOption = priorityField?.options?.find(opt => opt.value === priority);
    const priorityColors = priorityOption ? getStatusColor(priorityOption.color) : null;
    
    return (
        <div
            className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group"
            onClick={onClick}
        >
            {/* 头部：优先级 + 更多 */}
            <div className="flex items-center justify-between mb-2">
                {priorityOption && priorityColors && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors.bg} ${priorityColors.text}`}>
                        {priorityOption.label}
                    </span>
                )}
                <button className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={14} />
                </button>
            </div>
            
            {/* 标题 */}
            <h4 className="text-sm font-medium text-slate-800 mb-2 line-clamp-2">
                {title}
            </h4>
            
            {/* 标签 */}
            {labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {labels.slice(0, 3).map((label, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                            <Tag size={10} />
                            {label}
                        </span>
                    ))}
                    {labels.length > 3 && (
                        <span className="text-xs text-slate-400">+{labels.length - 3}</span>
                    )}
                </div>
            )}
            
            {/* 底部：负责人 + 工时 */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                {assignee && (
                    <div className="flex items-center gap-1">
                        <User size={12} />
                        <span className="truncate max-w-[80px]">{assignee}</span>
                    </div>
                )}
                {estimate !== undefined && (
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{estimate}h</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default KanbanCard;

