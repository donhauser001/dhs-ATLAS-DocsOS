/**
 * ListTableRenderer - 表格列表渲染器
 * 
 * 以表格形式展示列表数据
 */

import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Tag } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { FieldSchema, DataItem } from './types';
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
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
            {option.label}
        </span>
    );
}

interface TagCellProps {
    tags: string[];
}

function TagCell({ tags }: TagCellProps) {
    if (!tags || tags.length === 0) return <span className="text-slate-400">—</span>;
    
    return (
        <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
                <span
                    key={index}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                >
                    <Tag size={10} />
                    {tag}
                </span>
            ))}
            {tags.length > 3 && (
                <span className="text-xs text-slate-400">+{tags.length - 3}</span>
            )}
        </div>
    );
}

interface TableCellProps {
    value: unknown;
    schema: FieldSchema;
}

function TableCell({ value, schema }: TableCellProps) {
    if (value === null || value === undefined) {
        return <span className="text-slate-400">—</span>;
    }
    
    switch (schema.type) {
        case 'select':
            return <StatusBadge value={String(value)} schema={schema} />;
            
        case 'tags':
            return <TagCell tags={value as string[]} />;
            
        case 'date':
            return <span className="text-slate-600">{formatDate(String(value))}</span>;
            
        case 'textarea':
            const text = String(value);
            return (
                <span className="text-slate-600 line-clamp-1" title={text}>
                    {text.length > 50 ? text.slice(0, 50) + '...' : text}
                </span>
            );
            
        default:
            return <span className="text-slate-700">{getFieldDisplayValue(value, schema)}</span>;
    }
}

// ============================================================
// 主组件
// ============================================================

type SortDirection = 'asc' | 'desc' | null;

export function ListTableRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    
    // 解析 atlas-data 代码块
    const dataBlock = useMemo(() => {
        return parseFirstAtlasDataBlock(bodyContent);
    }, [bodyContent]);
    
    // 排序数据
    const sortedData = useMemo(() => {
        if (!dataBlock || !sortKey || !sortDirection) {
            return dataBlock?.data || [];
        }
        
        return [...dataBlock.data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            
            let comparison = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                comparison = aVal.localeCompare(bVal);
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [dataBlock, sortKey, sortDirection]);
    
    const handleSort = (key: string) => {
        if (sortKey === key) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortKey(null);
                setSortDirection(null);
            }
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    const { schema } = dataBlock;
    
    // 过滤掉不适合表格展示的字段
    const visibleFields = schema.filter(f => f.type !== 'textarea' || f.key === 'description');
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 列表统计 */}
            <div className="flex items-center justify-between mb-4 w-full">
                <div className="text-sm text-slate-500">
                    共 <span className="font-medium text-slate-700">{sortedData.length}</span> 条记录
                </div>
            </div>
            
            {/* 表格 */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden w-full">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                {visibleFields.map((field) => (
                                    <th
                                        key={field.key}
                                        className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => handleSort(field.key)}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>{field.label}</span>
                                            {sortKey === field.key && (
                                                sortDirection === 'asc' ? (
                                                    <ChevronUp size={14} className="text-purple-500" />
                                                ) : (
                                                    <ChevronDown size={14} className="text-purple-500" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedData.map((item, rowIndex) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => console.log('Row clicked:', item.id)}
                                >
                                    {visibleFields.map((field) => (
                                        <td
                                            key={field.key}
                                            className="px-4 py-3 text-sm whitespace-nowrap"
                                        >
                                            <TableCell value={item[field.key]} schema={field} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* 空状态 */}
            {sortedData.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <p>暂无数据</p>
                </div>
            )}
        </div>
    );
}

export default ListTableRenderer;

