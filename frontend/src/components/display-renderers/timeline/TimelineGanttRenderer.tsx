/**
 * TimelineGanttRenderer - 甘特图渲染器
 * 
 * 显示任务的开始和结束时间，可视化任务持续时间
 */

import { useMemo } from 'react';
import { Flag, Rocket, Calendar, Lightbulb, Circle } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { getStatusColor } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import { parseTimelineData, type TimelineEvent } from './types';

// ============================================================
// 工具函数
// ============================================================

const TYPE_ICONS: Record<string, React.ReactNode> = {
    milestone: <Flag size={12} />,
    release: <Rocket size={12} />,
    event: <Calendar size={12} />,
    decision: <Lightbulb size={12} />,
};

function getMonthsBetween(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (current <= endMonth) {
        months.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
    }
    
    return months;
}

function formatMonthShort(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
        month: 'short',
    });
}

function formatYear(date: Date): string {
    return date.getFullYear().toString();
}

// ============================================================
// 子组件
// ============================================================

interface GanttRowProps {
    event: TimelineEvent;
    minDate: Date;
    maxDate: Date;
    totalDays: number;
}

function GanttRow({ event, minDate, totalDays }: GanttRowProps) {
    const colors = event.typeOption ? getStatusColor(event.typeOption.color) : getStatusColor('blue');
    const icon = TYPE_ICONS[event.type || ''] || <Circle size={12} />;
    
    const isCompleted = event.progress === 100;
    const isFuture = event.date > new Date();
    
    // 计算位置和宽度
    const startOffset = Math.max(0, (event.date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = event.endDate 
        ? (event.endDate.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24) + 1
        : 1;
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = Math.max(2, (duration / totalDays) * 100); // 最小2%宽度
    
    return (
        <div className="flex items-center h-10 border-b border-slate-100 group">
            {/* 任务名称 */}
            <div className="flex-shrink-0 w-56 px-3 flex items-center gap-2 border-r border-slate-100">
                <span className={`${colors.text}`}>
                    {icon}
                </span>
                <span className="text-sm text-slate-700 truncate" title={event.title}>
                    {event.title}
                </span>
            </div>
            
            {/* 甘特条 */}
            <div className="flex-1 relative h-full px-2">
                <div
                    className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md flex items-center px-2 text-xs font-medium transition-all
                        ${isFuture 
                            ? 'border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400'
                            : `${colors.bg} ${colors.text}`
                        }
                        ${event.endDate ? '' : 'w-6 justify-center'}
                    `}
                    style={{
                        left: `${leftPercent}%`,
                        width: event.endDate ? `${widthPercent}%` : undefined,
                        minWidth: event.endDate ? '60px' : undefined,
                    }}
                    title={`${event.title}: ${event.date.toLocaleDateString('zh-CN')}${event.endDate ? ` - ${event.endDate.toLocaleDateString('zh-CN')}` : ''}`}
                >
                    {event.endDate && (
                        <>
                            {isCompleted && <span className="mr-1">✓</span>}
                            {event.progress !== undefined && event.progress > 0 && event.progress < 100 && (
                                <span>{event.progress}%</span>
                            )}
                        </>
                    )}
                </div>
                
                {/* 进度覆盖层 */}
                {event.endDate && event.progress !== undefined && event.progress > 0 && event.progress < 100 && (
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-l-md ${colors.bg} opacity-50`}
                        style={{
                            left: `${leftPercent}%`,
                            width: `${(widthPercent * event.progress) / 100}%`,
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function TimelineGanttRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    // 解析 atlas-data 代码块
    const dataBlock = useMemo(() => {
        return parseFirstAtlasDataBlock(bodyContent);
    }, [bodyContent]);
    
    // 解析时间线数据
    const events = useMemo(() => {
        if (!dataBlock) return [];
        const extendedBlock = dataBlock as AtlasDataBlock & { dateField?: string; endDateField?: string };
        return parseTimelineData(
            dataBlock,
            extendedBlock.dateField || 'date',
            extendedBlock.endDateField || 'end_date'
        );
    }, [dataBlock]);
    
    // 计算时间范围
    const { minDate, maxDate, totalDays, months } = useMemo(() => {
        if (events.length === 0) {
            const now = new Date();
            return {
                minDate: now,
                maxDate: now,
                totalDays: 1,
                months: [now],
            };
        }
        
        let min = events[0].date;
        let max = events[0].endDate || events[0].date;
        
        events.forEach(e => {
            if (e.date < min) min = e.date;
            const end = e.endDate || e.date;
            if (end > max) max = end;
        });
        
        // 扩展范围，前后各加一个月
        const minDate = new Date(min.getFullYear(), min.getMonth() - 1, 1);
        const maxDate = new Date(max.getFullYear(), max.getMonth() + 2, 0);
        
        const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
        const months = getMonthsBetween(minDate, maxDate);
        
        return { minDate, maxDate, totalDays, months };
    }, [events]);
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    return (
        <div className={`w-full px-8 py-6 ${className || ''}`}>
            {/* 统计 */}
            <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
                <span>共 <span className="font-medium text-slate-700">{events.length}</span> 个任务</span>
            </div>
            
            {/* 甘特图 */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* 头部：月份 */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    <div className="flex-shrink-0 w-56 px-3 py-2 border-r border-slate-200 text-xs font-medium text-slate-600">
                        任务
                    </div>
                    <div className="flex-1 flex">
                        {months.map((month, index) => {
                            const isFirstOfYear = month.getMonth() === 0;
                            return (
                                <div
                                    key={index}
                                    className="flex-1 px-1 py-2 text-center border-r border-slate-100 last:border-r-0"
                                    style={{ minWidth: '60px' }}
                                >
                                    {isFirstOfYear && (
                                        <div className="text-[10px] text-slate-400">{formatYear(month)}</div>
                                    )}
                                    <div className="text-xs text-slate-600">{formatMonthShort(month)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* 任务行 */}
                <div className="divide-y divide-slate-100">
                    {events.map(event => (
                        <GanttRow
                            key={event.id}
                            event={event}
                            minDate={minDate}
                            maxDate={maxDate}
                            totalDays={totalDays}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TimelineGanttRenderer;

