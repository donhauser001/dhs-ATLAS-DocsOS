/**
 * CalendarWeekRenderer - 周视图
 * 
 * 按周展示日程，显示具体时间段
 */

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Users, MapPin, Clock } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { getStatusColor } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import {
    parseCalendarData,
    getWeekDays,
    formatTime,
    formatDate,
    WEEKDAY_NAMES_FULL,
    type CalendarEvent,
} from './types';

// 时间轴小时 (6:00 - 22:00，覆盖工作时间和常见活动)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00
const START_HOUR = 6;

// ============================================================
// 子组件
// ============================================================

interface TimeEventProps {
    event: CalendarEvent;
    dayStart: Date;
}

function TimeEvent({ event, dayStart }: TimeEventProps) {
    const colors = event.typeOption ? getStatusColor(event.typeOption.color) : getStatusColor('gray');
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    
    // 计算事件在时间轴上的位置
    const startHour = event.startDate.getHours() + event.startDate.getMinutes() / 60;
    const endHour = event.endDate 
        ? event.endDate.getHours() + event.endDate.getMinutes() / 60
        : startHour + 1;
    
    const END_HOUR = 22;
    
    // 如果事件完全在显示范围外，不显示
    if (startHour >= END_HOUR || endHour <= START_HOUR) {
        return null;
    }
    
    // 限制在显示范围内
    const displayStart = Math.max(startHour, START_HOUR);
    const displayEnd = Math.min(endHour, END_HOUR);
    
    const top = (displayStart - START_HOUR) * 48; // 每小时 48px
    const height = Math.max((displayEnd - displayStart) * 48, 20);
    
    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.top + rect.height / 2,
            left: rect.right + 8,
        });
        setShowTooltip(true);
    };
    
    return (
        <>
            <div
                className={`
                    absolute left-1 right-1 px-1.5 py-1 rounded text-[10px] overflow-hidden
                    cursor-pointer transition-all hover:opacity-90 hover:shadow-md
                    ${colors.bg} ${colors.text}
                `}
                style={{ top, height: Math.max(height, 20) }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="font-medium truncate">{event.title}</div>
                {height >= 40 && (
                    <div className="opacity-70 truncate">
                        {formatTime(event.startDate)}
                        {event.endDate && ` - ${formatTime(event.endDate)}`}
                    </div>
                )}
            </div>
            
            {/* Tooltip */}
            {showTooltip && createPortal(
                <div 
                    className="fixed w-56 p-3 bg-white rounded-lg shadow-xl border border-slate-200 z-[9999] pointer-events-none"
                    style={{ 
                        top: tooltipPos.top,
                        left: tooltipPos.left,
                        transform: 'translateY(-50%)',
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

interface AllDayEventProps {
    event: CalendarEvent;
}

function AllDayEvent({ event }: AllDayEventProps) {
    const colors = event.typeOption ? getStatusColor(event.typeOption.color) : getStatusColor('gray');
    
    return (
        <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${colors.bg} ${colors.text}`}>
            {event.title}
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function CalendarWeekRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const dataBlock = useMemo(() => parseFirstAtlasDataBlock(bodyContent), [bodyContent]);
    
    const [currentDate, setCurrentDate] = useState(() => new Date());
    
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
    
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
    
    // 获取每天的事件 - 使用本地日期比较
    const dayEvents = useMemo(() => {
        return weekDays.map(day => {
            // 使用本地日期进行比较
            const dayYear = day.getFullYear();
            const dayMonth = day.getMonth();
            const dayDate = day.getDate();
            
            const dayEvts = calendarEvents.filter(event => {
                const eventStart = event.startDate;
                const eventEnd = event.endDate || eventStart;
                
                // 比较本地日期
                const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
                const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
                const currentDate = new Date(dayYear, dayMonth, dayDate);
                
                return eventStartDate <= currentDate && eventEndDate >= currentDate;
            });
            
            return {
                allDay: dayEvts.filter(e => e.allDay),
                timed: dayEvts.filter(e => !e.allDay),
            };
        });
    }, [weekDays, calendarEvents]);
    
    const goToPrevWeek = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 7);
            return d;
        });
    };
    
    const goToNextWeek = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 7);
            return d;
        });
    };
    
    const goToToday = () => {
        setCurrentDate(new Date());
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 头部导航 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {formatDate(weekStart)} - {formatDate(weekEnd)}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    >
                        本周
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevWeek}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button
                        onClick={goToNextWeek}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>
            </div>
            
            {/* 周视图 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* 头部：星期 + 日期 */}
                <div className="grid grid-cols-8 bg-slate-50 border-b border-slate-200">
                    <div className="py-2 px-2 text-xs text-slate-400">时间</div>
                    {weekDays.map((day, index) => {
                        const isToday = day.getTime() === today.getTime();
                        const isWeekend = index === 0 || index === 6;
                        
                        return (
                            <div
                                key={index}
                                className={`
                                    py-2 text-center border-l border-slate-200
                                    ${isWeekend ? 'text-slate-400' : 'text-slate-600'}
                                `}
                            >
                                <div className="text-xs">{WEEKDAY_NAMES_FULL[index]}</div>
                                <div className={`
                                    text-lg font-semibold
                                    ${isToday ? 'w-8 h-8 mx-auto rounded-full bg-purple-500 text-white flex items-center justify-center' : ''}
                                `}>
                                    {day.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* 全天事件区域 */}
                <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-25">
                    <div className="py-2 px-2 text-[10px] text-slate-400">全天</div>
                    {dayEvents.map((events, index) => (
                        <div key={index} className="p-1 border-l border-slate-200 space-y-0.5 min-h-[40px]">
                            {events.allDay.map(event => (
                                <AllDayEvent key={event.id} event={event} />
                            ))}
                        </div>
                    ))}
                </div>
                
                {/* 时间轴 */}
                <div className="grid grid-cols-8 max-h-[600px] overflow-y-auto">
                    {/* 时间列 */}
                    <div className="relative">
                        {HOURS.map(hour => (
                            <div
                                key={hour}
                                className="h-[48px] px-2 text-right text-[10px] text-slate-400 border-b border-slate-100"
                            >
                                {String(hour).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>
                    
                    {/* 每天的时间格 */}
                    {weekDays.map((day, dayIndex) => (
                        <div key={dayIndex} className="relative border-l border-slate-200">
                            {/* 时间格线 */}
                            {HOURS.map(hour => (
                                <div
                                    key={hour}
                                    className="h-[48px] border-b border-slate-100"
                                />
                            ))}
                            
                            {/* 事件 */}
                            {dayEvents[dayIndex].timed.map(event => (
                                <TimeEvent key={event.id} event={event} dayStart={day} />
                            ))}
                            
                            {/* 当前时间线 */}
                            {day.getTime() === today.getTime() && (
                                <div
                                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                                    style={{
                                        top: Math.max((new Date().getHours() + new Date().getMinutes() / 60 - START_HOUR), 0) * 48,
                                    }}
                                >
                                    <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CalendarWeekRenderer;

