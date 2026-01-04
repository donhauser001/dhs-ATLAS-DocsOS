/**
 * CalendarHeatmapRenderer - 热力图视图
 * 
 * 类似 GitHub 贡献图，用颜色深浅表示活跃度
 */

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import {
    parseCalendarData,
    MONTH_NAMES,
    WEEKDAY_NAMES,
    type CalendarEvent,
} from './types';

// 热力等级颜色
const HEAT_COLORS = [
    'bg-slate-100', // 0
    'bg-green-100', // 1-25%
    'bg-green-300', // 26-50%
    'bg-green-500', // 51-75%
    'bg-green-700', // 76-100%
];

// ============================================================
// 辅助函数
// ============================================================

// 获取一年的所有周
function getYearWeeks(year: number): Date[][] {
    const weeks: Date[][] = [];
    
    // 从1月1日开始
    let currentDate = new Date(year, 0, 1);
    
    // 调整到周日
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0) {
        currentDate.setDate(currentDate.getDate() - dayOfWeek);
    }
    
    // 生成53周
    for (let w = 0; w < 53; w++) {
        const week: Date[] = [];
        for (let d = 0; d < 7; d++) {
            week.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        weeks.push(week);
        
        // 如果已经超过当年，停止
        if (currentDate.getFullYear() > year && currentDate.getMonth() > 0) {
            break;
        }
    }
    
    return weeks;
}

// 获取日期的热力值
function getHeatValue(date: Date, events: CalendarEvent[]): number {
    const dateStr = date.toISOString().split('T')[0];
    
    // 计算这一天的总值
    const dayEvents = events.filter(e => {
        const eventDateStr = e.startDate.toISOString().split('T')[0];
        return eventDateStr === dateStr;
    });
    
    // 如果有 value 字段，累加值；否则计算事件数量
    const totalValue = dayEvents.reduce((sum, e) => sum + (e.value || 1), 0);
    
    return totalValue;
}

// 获取热力等级
function getHeatLevel(value: number, maxValue: number): number {
    if (value === 0) return 0;
    const percentage = value / maxValue;
    if (percentage <= 0.25) return 1;
    if (percentage <= 0.5) return 2;
    if (percentage <= 0.75) return 3;
    return 4;
}

// ============================================================
// 子组件
// ============================================================

interface HeatCellProps {
    date: Date;
    value: number;
    level: number;
    isCurrentYear: boolean;
}

function HeatCell({ date, value, level, isCurrentYear }: HeatCellProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();
    const isFuture = date > today;
    
    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
        });
        setShowTooltip(true);
    };
    
    const dateStr = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    });
    
    return (
        <>
            <div
                className={`
                    w-[12px] h-[12px] rounded-sm cursor-pointer transition-all
                    ${!isCurrentYear ? 'opacity-30' : ''}
                    ${isFuture ? 'bg-slate-50 border border-slate-200' : HEAT_COLORS[level]}
                    ${isToday ? 'ring-2 ring-purple-400 ring-offset-1' : ''}
                    hover:ring-2 hover:ring-slate-400 hover:ring-offset-1
                `}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setShowTooltip(false)}
            />
            
            {/* Tooltip */}
            {showTooltip && createPortal(
                <div 
                    className="fixed px-2 py-1 bg-slate-800 text-white text-[10px] rounded shadow-lg z-[9999] pointer-events-none whitespace-nowrap"
                    style={{ 
                        top: tooltipPos.top,
                        left: tooltipPos.left,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <div className="font-medium">{value} 次活动</div>
                    <div className="opacity-70">{dateStr}</div>
                </div>,
                document.body
            )}
        </>
    );
}

// ============================================================
// 主组件
// ============================================================

export function CalendarHeatmapRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const dataBlock = useMemo(() => parseFirstAtlasDataBlock(bodyContent), [bodyContent]);
    
    const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
    
    const events = useMemo(() => {
        if (!dataBlock) return [];
        const extendedBlock = dataBlock as AtlasDataBlock & { dateField?: string; endDateField?: string };
        return parseCalendarData(dataBlock, extendedBlock.dateField || 'start_date', extendedBlock.endDateField);
    }, [dataBlock]);
    
    // 过滤当年的事件
    const yearEvents = useMemo(() => 
        events.filter(e => e.startDate.getFullYear() === currentYear),
        [events, currentYear]
    );
    
    // 生成周数据
    const weeks = useMemo(() => getYearWeeks(currentYear), [currentYear]);
    
    // 计算每天的热力值
    const heatData = useMemo(() => {
        const data = new Map<string, number>();
        
        weeks.forEach(week => {
            week.forEach(date => {
                const value = getHeatValue(date, yearEvents);
                data.set(date.toISOString().split('T')[0], value);
            });
        });
        
        return data;
    }, [weeks, yearEvents]);
    
    // 计算最大值
    const maxValue = useMemo(() => {
        let max = 1;
        heatData.forEach(value => {
            if (value > max) max = value;
        });
        return max;
    }, [heatData]);
    
    // 计算统计数据
    const stats = useMemo(() => {
        let totalValue = 0;
        let activeDays = 0;
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        weeks.forEach(week => {
            week.forEach(date => {
                if (date.getFullYear() !== currentYear) return;
                if (date > today) return;
                
                const value = heatData.get(date.toISOString().split('T')[0]) || 0;
                totalValue += value;
                
                if (value > 0) {
                    activeDays++;
                    tempStreak++;
                    if (tempStreak > maxStreak) maxStreak = tempStreak;
                } else {
                    tempStreak = 0;
                }
            });
        });
        
        // 计算当前连续天数
        const sortedDates = Array.from(heatData.entries())
            .filter(([_, v]) => v > 0)
            .map(([d]) => new Date(d))
            .sort((a, b) => b.getTime() - a.getTime());
        
        if (sortedDates.length > 0) {
            let checkDate = new Date(today);
            for (const date of sortedDates) {
                if (date.getTime() === checkDate.getTime()) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else if (date < checkDate) {
                    break;
                }
            }
        }
        
        return { totalValue, activeDays, currentStreak, maxStreak };
    }, [weeks, heatData, currentYear]);
    
    // 获取月份标签位置
    const monthLabels = useMemo(() => {
        const labels: { month: number; weekIndex: number }[] = [];
        let lastMonth = -1;
        
        weeks.forEach((week, weekIndex) => {
            const firstDayOfWeek = week[0];
            if (firstDayOfWeek.getFullYear() === currentYear) {
                const month = firstDayOfWeek.getMonth();
                if (month !== lastMonth) {
                    labels.push({ month, weekIndex });
                    lastMonth = month;
                }
            }
        });
        
        return labels;
    }, [weeks, currentYear]);
    
    const goToPrevYear = () => setCurrentYear(prev => prev - 1);
    const goToNextYear = () => setCurrentYear(prev => prev + 1);
    const goToCurrentYear = () => setCurrentYear(new Date().getFullYear());
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {currentYear} 年活动热力图
                    </h2>
                    <button
                        onClick={goToCurrentYear}
                        className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    >
                        今年
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevYear}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button
                        onClick={goToNextYear}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>
            
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.totalValue}</div>
                    <div className="text-sm text-slate-500">总活动次数</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.activeDays}</div>
                    <div className="text-sm text-slate-500">活跃天数</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.currentStreak}</div>
                    <div className="text-sm text-slate-500">当前连续天数</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">{stats.maxStreak}</div>
                    <div className="text-sm text-slate-500">最长连续天数</div>
                </div>
            </div>
            
            {/* 热力图 */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 overflow-x-auto">
                {/* 热力图主体 */}
                <div className="inline-flex">
                    {/* 星期标签 */}
                    <div className="flex flex-col gap-[2px] mr-2 text-[10px] text-slate-400 mt-[18px]">
                        {WEEKDAY_NAMES.map((name, index) => (
                            <div key={name} className="h-[12px] flex items-center justify-end pr-1">
                                {index % 2 === 1 ? name : ''}
                            </div>
                        ))}
                    </div>
                    
                    {/* 热力格子和月份标签 */}
                    <div className="flex gap-[2px]">
                        {weeks.map((week, weekIndex) => {
                            // 检查这一周是否是新月份的开始
                            const firstDayOfWeek = week[0];
                            const prevWeek = weekIndex > 0 ? weeks[weekIndex - 1] : null;
                            const prevFirstDay = prevWeek ? prevWeek[0] : null;
                            
                            // 显示条件：这是当前年份，并且这周的月份与上周不同
                            const isNewMonth = firstDayOfWeek.getFullYear() === currentYear && 
                                (!prevFirstDay || prevFirstDay.getMonth() !== firstDayOfWeek.getMonth() || prevFirstDay.getFullYear() !== currentYear);
                            const monthLabel = isNewMonth ? MONTH_NAMES[firstDayOfWeek.getMonth()] : '';
                            
                            return (
                            <div key={weekIndex} className="flex flex-col gap-[2px]">
                                {/* 月份标签 */}
                                <div className="h-[16px] text-[10px] text-slate-500 whitespace-nowrap">
                                    {monthLabel}
                                </div>
                                {/* 格子列 */}
                                {week.map((date, dayIndex) => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const value = heatData.get(dateStr) || 0;
                                    const level = getHeatLevel(value, maxValue);
                                    const isCurrentYear = date.getFullYear() === currentYear;
                                    
                                    return (
                                        <HeatCell
                                            key={dayIndex}
                                            date={date}
                                            value={value}
                                            level={level}
                                            isCurrentYear={isCurrentYear}
                                        />
                                    );
                                })}
                            </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* 图例 */}
                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-500">
                    <span>少</span>
                    {HEAT_COLORS.map((color, index) => (
                        <div key={index} className={`w-3 h-3 rounded-sm ${color}`} />
                    ))}
                    <span>多</span>
                </div>
            </div>
        </div>
    );
}

export default CalendarHeatmapRenderer;

