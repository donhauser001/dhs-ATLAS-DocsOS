/**
 * Timestamp 组件 - 数据块控件
 * 
 * 自动记录时间戳，支持：
 * - 创建时间（首次设置后不变）
 * - 更新时间（每次保存时更新）
 * - 自定义时间
 * - 相对时间显示
 */

import { useEffect, useMemo } from 'react';
import { Clock, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, TimestampComponentDefinition } from '../../types';

/** 格式化日期 */
export function formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/** 计算相对时间 */
export function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 30) return `${diffDays} 天前`;
    if (diffMonths < 12) return `${diffMonths} 个月前`;
    return `${diffYears} 年前`;
}

/** 解析日期字符串 */
export function parseDate(value: string | number | null | undefined): Date | null {
    if (!value) return null;
    
    if (typeof value === 'number') {
        return new Date(value);
    }
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const tsDef = component as TimestampComponentDefinition;
    
    // 解析当前值
    const currentDate = useMemo(() => {
        return parseDate(value as string | number | null | undefined);
    }, [value]);

    // 自动设置创建时间
    useEffect(() => {
        if (tsDef.timestampType === 'created' && !value) {
            onChange(new Date().toISOString());
        }
    }, []);

    // 格式化显示
    const formattedDate = useMemo(() => {
        if (!currentDate) return null;
        return formatDate(currentDate, tsDef.format || 'YYYY-MM-DD HH:mm:ss');
    }, [currentDate, tsDef.format]);

    // 相对时间
    const relativeTime = useMemo(() => {
        if (!currentDate) return null;
        return getRelativeTime(currentDate);
    }, [currentDate]);

    // 手动更新时间戳
    const handleUpdate = () => {
        if (!disabled) {
            onChange(new Date().toISOString());
        }
    };

    // 时间戳类型标签
    const typeLabel = {
        created: '创建时间',
        updated: '更新时间',
        custom: '自定义时间',
    }[tsDef.timestampType || 'created'];

    // 图标
    const Icon = tsDef.timestampType === 'updated' ? RefreshCw : Calendar;

    return (
        <div className="space-y-1">
            <div className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                currentDate ? 'bg-slate-50' : 'bg-orange-50'
            )}>
                <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    currentDate ? 'bg-slate-200 text-slate-600' : 'bg-orange-200 text-orange-600'
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 mb-0.5">{typeLabel}</div>
                    {currentDate ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">
                                {formattedDate}
                            </span>
                            {tsDef.showRelative && relativeTime && (
                                <span className="text-xs text-slate-400">
                                    ({relativeTime})
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-sm text-orange-600">未设置</span>
                    )}
                </div>

                {/* 手动更新按钮（仅 updated 和 custom 类型） */}
                {!disabled && tsDef.timestampType !== 'created' && (
                    <button
                        type="button"
                        onClick={handleUpdate}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="更新时间"
                    >
                        <Clock className="h-3 w-3" />
                        更新
                    </button>
                )}
            </div>
        </div>
    );
}

export default Control;


