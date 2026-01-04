/**
 * ListCompactRenderer - 紧凑列表渲染器
 * 
 * 以紧凑的单行形式展示列表数据
 */

import { useMemo } from 'react';
import { Circle, CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { FieldSchema, DataItem } from './types';
import { getStatusColor } from './types';
import { parseFirstAtlasDataBlock, formatDate } from './parseAtlasData';

// ============================================================
// 子组件
// ============================================================

interface StatusIconProps {
    status: string;
    schema: FieldSchema;
}

function StatusIcon({ status, schema }: StatusIconProps) {
    const option = schema.options?.find(opt => opt.value === status);
    const color = option?.color || 'gray';
    
    const iconMap: Record<string, React.ReactNode> = {
        pending: <Circle size={16} className="text-slate-400" />,
        todo: <Circle size={16} className="text-blue-500" />,
        in_progress: <Clock size={16} className="text-orange-500" />,
        completed: <CheckCircle2 size={16} className="text-green-500" />,
        done: <CheckCircle2 size={16} className="text-green-500" />,
        cancelled: <XCircle size={16} className="text-red-400" />,
    };
    
    const colorClasses: Record<string, string> = {
        gray: 'text-slate-400',
        blue: 'text-blue-500',
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        orange: 'text-orange-500',
        red: 'text-red-500',
        purple: 'text-purple-500',
    };
    
    return iconMap[status] || <AlertCircle size={16} className={colorClasses[color] || 'text-slate-400'} />;
}

interface PriorityIndicatorProps {
    priority: string;
    schema: FieldSchema;
}

function PriorityIndicator({ priority, schema }: PriorityIndicatorProps) {
    const option = schema.options?.find(opt => opt.value === priority);
    const color = option?.color || 'gray';
    
    const colorClasses: Record<string, string> = {
        gray: 'bg-slate-400',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        orange: 'bg-orange-500',
        red: 'bg-red-500',
        purple: 'bg-purple-500',
    };
    
    return (
        <div
            className={`w-1 h-full absolute left-0 top-0 rounded-l ${colorClasses[color] || 'bg-slate-300'}`}
            title={option?.label || priority}
        />
    );
}

interface CompactItemProps {
    item: DataItem;
    schema: FieldSchema[];
    onClick?: () => void;
}

function CompactItem({ item, schema, onClick }: CompactItemProps) {
    // 找到主要字段
    const titleField = schema.find(f => f.type === 'text');
    const statusField = schema.find(f => f.type === 'select' && f.key !== 'priority');
    const priorityField = schema.find(f => f.key === 'priority');
    const assigneeField = schema.find(f => f.key === 'assignee' || f.key === 'owner');
    const dateField = schema.find(f => f.type === 'date');
    const tagsField = schema.find(f => f.type === 'tags');
    
    const title = titleField ? String(item[titleField.key] || '未命名') : '未命名';
    const status = statusField ? item[statusField.key] as string : undefined;
    const priority = priorityField ? item[priorityField.key] as string : undefined;
    const assignee = assigneeField ? String(item[assigneeField.key] || '') : undefined;
    const date = dateField ? String(item[dateField.key] || '') : undefined;
    const tags = tagsField ? (item[tagsField.key] as string[]) || [] : [];
    
    const statusLabel = statusField?.options?.find(opt => opt.value === status)?.label;
    
    return (
        <div
            className="relative flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer group"
            onClick={onClick}
        >
            {/* 优先级指示条 */}
            {priority && priorityField && (
                <PriorityIndicator priority={priority} schema={priorityField} />
            )}
            
            {/* 状态图标 */}
            {status && statusField && (
                <StatusIcon status={status} schema={statusField} />
            )}
            
            {/* 标题 */}
            <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-800 truncate block">
                    {title}
                </span>
            </div>
            
            {/* 标签（最多显示2个） */}
            {tags.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                    {tags.slice(0, 2).map((tag, index) => (
                        <span
                            key={index}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs"
                        >
                            {tag}
                        </span>
                    ))}
                    {tags.length > 2 && (
                        <span className="text-xs text-slate-400">+{tags.length - 2}</span>
                    )}
                </div>
            )}
            
            {/* 负责人 */}
            {assignee && (
                <span className="hidden md:block text-xs text-slate-500 w-16 truncate text-right">
                    {assignee}
                </span>
            )}
            
            {/* 日期 */}
            {date && (
                <span className="text-xs text-slate-400 w-24 text-right">
                    {formatDate(date)}
                </span>
            )}
            
            {/* 箭头 */}
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function ListCompactRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    // 解析 atlas-data 代码块
    const dataBlock = useMemo(() => {
        return parseFirstAtlasDataBlock(bodyContent);
    }, [bodyContent]);
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    const { schema, data } = dataBlock;
    
    // 按状态分组统计
    const statusField = schema.find(f => f.type === 'select' && f.key !== 'priority');
    const statusCounts = useMemo(() => {
        if (!statusField) return {};
        return data.reduce((acc, item) => {
            const status = String(item[statusField.key] || 'unknown');
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [data, statusField]);
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 统计摘要 */}
            <div className="flex items-center gap-4 mb-4 text-sm w-full">
                <span className="text-slate-500">
                    共 <span className="font-medium text-slate-700">{data.length}</span> 条
                </span>
                {statusField && statusField.options && (
                    <div className="flex items-center gap-3 text-xs">
                        {statusField.options.map((opt) => {
                            const count = statusCounts[opt.value] || 0;
                            if (count === 0) return null;
                            const colors = getStatusColor(opt.color);
                            return (
                                <span key={opt.value} className="flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                                    <span className="text-slate-500">{opt.label}</span>
                                    <span className="text-slate-700 font-medium">{count}</span>
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* 紧凑列表 */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden w-full">
                {data.map((item) => (
                    <CompactItem
                        key={item.id}
                        item={item}
                        schema={schema}
                        onClick={() => console.log('Item clicked:', item.id)}
                    />
                ))}
            </div>
            
            {/* 空状态 */}
            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-200 w-full">
                    <p>暂无数据</p>
                </div>
            )}
        </div>
    );
}

export default ListCompactRenderer;

