/**
 * CalendarMonthRenderer - 月历视图
 * 
 * 传统月历视图，显示整月的日程安排
 */

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Users, MapPin, Clock, Calendar } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { getStatusColor } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import {
    parseCalendarData,
    getMonthCalendar,
    assignEventsToCalendar,
    formatTime,
    MONTH_NAMES,
    WEEKDAY_NAMES,
    type CalendarEvent,
    type CalendarDay,
} from './types';

// ============================================================
// 子组件
// ============================================================

interface EventBadgeProps {
    event: CalendarEvent;
    compact?: boolean;
}

function EventBadge({ event, compact }: EventBadgeProps) {
    const colors = event.typeOption ? getStatusColor(event.typeOption.color) : getStatusColor('gray');
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    
    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.bottom + 4,
            left: rect.left + rect.width / 2,
        });
        setShowTooltip(true);
    };
    
    return (
        <>
            <div
                className={`
                    px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer
                    transition-all hover:opacity-80
                    ${colors.bg} ${colors.text}
                `}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {!event.allDay && !compact && (
                    <span className="opacity-70 mr-1">{formatTime(event.startDate)}</span>
                )}
                {event.title}
            </div>
            
            {/* Tooltip */}
            {showTooltip && createPortal(
                <div 
                    className="fixed w-56 p-3 bg-white rounded-lg shadow-xl border border-slate-200 z-[9999] pointer-events-none"
                    style={{ 
                        top: tooltipPos.top,
                        left: tooltipPos.left,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <h4 className="font-medium text-slate-800 text-sm mb-2">{event.title}</h4>
                    
                    {event.typeOption && (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-2 ${colors.bg} ${colors.text}`}>
                            {event.typeOption.label}
                        </span>
                    )}
                    
                    <div className="space-y-1.5 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" />
                            <span>
                                {event.allDay ? '全天' : `${formatTime(event.startDate)}${event.endDate ? ` - ${formatTime(event.endDate)}` : ''}`}
                            </span>
                        </div>
                        
                        {event.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-slate-400" />
                                <span>{event.location}</span>
                            </div>
                        )}
                        
                        {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-slate-400" />
                                <span>{event.attendees.join(', ')}</span>
                            </div>
                        )}
                        
                        {event.description && (
                            <p className="text-slate-500 mt-2 pt-2 border-t border-slate-100">
                                {event.description}
                            </p>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

interface DayCellProps {
    day: CalendarDay;
    maxEvents?: number;
}

function DayCell({ day, maxEvents = 3 }: DayCellProps) {
    const displayEvents = day.events.slice(0, maxEvents);
    const moreCount = day.events.length - maxEvents;
    
    return (
        <div
            className={`
                min-h-[100px] p-1.5 border-b border-r border-slate-100
                ${!day.isCurrentMonth ? 'bg-slate-50' : 'bg-white'}
                ${day.isToday ? 'bg-purple-50' : ''}
            `}
        >
            {/* 日期数字 */}
            <div className={`
                text-sm font-medium mb-1
                ${day.isToday 
                    ? 'w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center' 
                    : day.isCurrentMonth 
                        ? day.isWeekend ? 'text-slate-400' : 'text-slate-700'
                        : 'text-slate-300'
                }
            `}>
                {day.date.getDate()}
            </div>
            
            {/* 事件列表 */}
            <div className="space-y-0.5">
                {displayEvents.map(event => (
                    <EventBadge key={event.id} event={event} compact />
                ))}
                {moreCount > 0 && (
                    <div className="text-[10px] text-slate-400 px-1.5">
                        +{moreCount} 更多
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function CalendarMonthRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const dataBlock = useMemo(() => parseFirstAtlasDataBlock(bodyContent), [bodyContent]);
    
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const events = useMemo(() => {
        if (!dataBlock) return [];
        const extendedBlock = dataBlock as AtlasDataBlock & { dateField?: string; endDateField?: string };
        return parseCalendarData(dataBlock, extendedBlock.dateField || 'start_date', extendedBlock.endDateField);
    }, [dataBlock]);
    
    // 过滤掉活动类型（用于热力图的数据）
    const calendarEvents = useMemo(() => 
        events.filter(e => e.type !== 'activity'),
        [events]
    );
    
    const calendar = useMemo(() => {
        const weeks = getMonthCalendar(currentYear, currentMonth);
        return assignEventsToCalendar(weeks, calendarEvents);
    }, [currentYear, currentMonth, calendarEvents]);
    
    const goToPrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    
    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const goToToday = () => {
        setCurrentDate(new Date());
    };
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 头部导航 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {currentYear}年 {MONTH_NAMES[currentMonth]}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    >
                        今天
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>
            
            {/* 日历网格 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* 星期标题 */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {WEEKDAY_NAMES.map((name, index) => (
                        <div
                            key={name}
                            className={`
                                py-2 text-center text-sm font-medium
                                ${index === 0 || index === 6 ? 'text-slate-400' : 'text-slate-600'}
                            `}
                        >
                            {name}
                        </div>
                    ))}
                </div>
                
                {/* 日期网格 */}
                <div>
                    {calendar.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7">
                            {week.days.map((day, dayIndex) => (
                                <DayCell key={dayIndex} day={day} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* 图例 */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="font-medium text-slate-600">图例:</span>
                {[
                    { label: '会议', color: 'blue' },
                    { label: '截止日期', color: 'red' },
                    { label: '活动', color: 'green' },
                    { label: '假期', color: 'purple' },
                    { label: '提醒', color: 'orange' },
                ].map(item => {
                    const colors = getStatusColor(item.color);
                    return (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <span className={`w-3 h-3 rounded ${colors.bg}`} />
                            <span>{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CalendarMonthRenderer;

