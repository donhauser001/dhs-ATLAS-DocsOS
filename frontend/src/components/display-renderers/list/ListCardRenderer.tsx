/**
 * ListCardRenderer - 卡片列表渲染器
 * 
 * 以卡片形式展示列表数据，每条记录一张卡片
 */

import { useMemo } from 'react';
import { Calendar, User, Tag, MoreHorizontal } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock, FieldSchema, DataItem } from './types';
import { getStatusColor } from './types';
import { parseFirstAtlasDataBlock, formatDate, getFieldDisplayValue } from './parseAtlasData';

// ============================================================
// 子组件
// ============================================================

interface StatusBadgeProps {
    value: string;
    schema: FieldSchema;
}

function StatusBadge({ value, schema }: StatusBadgeProps) {
    const option = schema.options?.find(opt => opt.value === value);
    if (!option) return <span className="text-slate-500">{value}</span>;
    
    const colors = getStatusColor(option.color);
    
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
            {option.label}
        </span>
    );
}

interface TagListProps {
    tags: string[];
}

function TagList({ tags }: TagListProps) {
    if (!tags || tags.length === 0) return null;
    
    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                >
                    <Tag size={10} />
                    {tag}
                </span>
            ))}
        </div>
    );
}

interface DataCardProps {
    item: DataItem;
    schema: FieldSchema[];
    onClick?: () => void;
}

function DataCard({ item, schema, onClick }: DataCardProps) {
    // 找到主要字段（第一个 text 类型字段作为标题）
    const titleField = schema.find(f => f.type === 'text');
    const statusField = schema.find(f => f.type === 'select' && f.key !== 'priority');
    const priorityField = schema.find(f => f.key === 'priority');
    const assigneeField = schema.find(f => f.key === 'assignee' || f.key === 'owner');
    const dateField = schema.find(f => f.type === 'date');
    const tagsField = schema.find(f => f.type === 'tags');
    const descField = schema.find(f => f.type === 'textarea');
    
    const title = titleField ? String(item[titleField.key] || '未命名') : '未命名';
    const status = statusField ? item[statusField.key] as string : undefined;
    const priority = priorityField ? item[priorityField.key] as string : undefined;
    const assignee = assigneeField ? String(item[assigneeField.key] || '') : undefined;
    const date = dateField ? String(item[dateField.key] || '') : undefined;
    const tags = tagsField ? (item[tagsField.key] as string[]) || [] : [];
    const description = descField ? String(item[descField.key] || '') : undefined;
    
    return (
        <div
            className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group"
            onClick={onClick}
        >
            {/* 头部：状态 + 优先级 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {status && statusField && (
                        <StatusBadge value={status} schema={statusField} />
                    )}
                    {priority && priorityField && (
                        <StatusBadge value={priority} schema={priorityField} />
                    )}
                </div>
                <button className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={16} />
                </button>
            </div>
            
            {/* 标题 */}
            <h3 className="text-base font-medium text-slate-800 mb-2 line-clamp-2">
                {title}
            </h3>
            
            {/* 描述 */}
            {description && (
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                    {description}
                </p>
            )}
            
            {/* 标签 */}
            {tags.length > 0 && (
                <div className="mb-3">
                    <TagList tags={tags} />
                </div>
            )}
            
            {/* 底部：负责人 + 日期 */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                {assignee && (
                    <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{assignee}</span>
                    </div>
                )}
                {date && (
                    <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(date)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function ListCardRenderer({
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
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 列表统计 */}
            <div className="flex items-center justify-between mb-6 w-full">
                <div className="text-sm text-slate-500">
                    共 <span className="font-medium text-slate-700">{data.length}</span> 条记录
                </div>
            </div>
            
            {/* 卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                {data.map((item) => (
                    <DataCard
                        key={item.id}
                        item={item}
                        schema={schema}
                        onClick={() => console.log('Card clicked:', item.id)}
                    />
                ))}
            </div>
            
            {/* 空状态 */}
            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 w-full">
                    <p>暂无数据</p>
                </div>
            )}
        </div>
    );
}

export default ListCardRenderer;

