/**
 * 日历视图类型定义
 */

import type { AtlasDataBlock, SelectOption } from '../list/types';

// 日历事件
export interface CalendarEvent {
    id: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    type?: string;
    typeOption?: SelectOption;
    attendees?: string[];
    location?: string;
    description?: string;
    allDay?: boolean;
    value?: number; // 用于热力图
}

// 日历日期单元格
export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    events: CalendarEvent[];
}

// 周数据
export interface CalendarWeek {
    weekNumber: number;
    days: CalendarDay[];
}

// 解析本地时间字符串（不带时区信息的 ISO 字符串会被解析为本地时间）
function parseLocalDate(dateStr: string): Date {
    // 如果字符串没有时区信息（没有 Z 或 +/-），确保解析为本地时间
    if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        // 移除可能的毫秒部分并添加本地时间标记
        const [datePart, timePart] = dateStr.split('T');
        if (datePart && timePart) {
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePart.split(':').map(n => parseInt(n) || 0);
            return new Date(year, month - 1, day, hour, minute, second);
        }
    }
    return new Date(dateStr);
}

// 解析日历数据
export function parseCalendarData(
    dataBlock: AtlasDataBlock,
    dateField: string = 'start_date',
    endDateField?: string
): CalendarEvent[] {
    const { data, schema } = dataBlock;
    
    // 查找类型字段的选项
    const typeSchema = schema.find(s => s.key === 'type');
    const typeOptions = typeSchema?.options || [];
    
    return data
        .map(item => {
            const startDateValue = item[dateField];
            if (!startDateValue) return null;
            
            const startDate = parseLocalDate(String(startDateValue));
            if (isNaN(startDate.getTime())) return null;
            
            let endDate: Date | undefined;
            if (endDateField && item[endDateField]) {
                endDate = parseLocalDate(String(item[endDateField]));
                if (isNaN(endDate.getTime())) endDate = undefined;
            }
            
            const typeOption = typeOptions.find(opt => opt.value === item.type);
            
            return {
                id: item.id || String(Math.random()),
                title: item.title || item.name || '未命名事件',
                startDate,
                endDate,
                type: item.type,
                typeOption,
                attendees: item.attendees,
                location: item.location,
                description: item.description,
                allDay: item.all_day,
                value: item.value,
            } as CalendarEvent;
        })
        .filter((event): event is CalendarEvent => event !== null)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

// 获取某月的所有日期（包含前后月份补齐）
export function getMonthCalendar(year: number, month: number): CalendarWeek[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取第一天是星期几（0=周日）
    const startDayOfWeek = firstDay.getDay();
    
    // 计算需要显示的起始日期
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    
    const weeks: CalendarWeek[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    let weekNumber = 1;
    
    // 生成6周的日历（确保覆盖整月）
    for (let w = 0; w < 6; w++) {
        const days: CalendarDay[] = [];
        
        for (let d = 0; d < 7; d++) {
            const date = new Date(currentDate);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.getTime() === today.getTime();
            const isWeekend = d === 0 || d === 6;
            
            days.push({
                date,
                isCurrentMonth,
                isToday,
                isWeekend,
                events: [],
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        weeks.push({ weekNumber: weekNumber++, days });
        
        // 如果已经超过了当月最后一天，且已经完成一周，可以停止
        if (currentDate > lastDay && currentDate.getDay() === 0) {
            break;
        }
    }
    
    return weeks;
}

// 获取某周的所有日期
export function getWeekDays(date: Date): Date[] {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        days.push(d);
    }
    
    return days;
}

// 将事件分配到日历单元格
export function assignEventsToCalendar(
    weeks: CalendarWeek[],
    events: CalendarEvent[]
): CalendarWeek[] {
    return weeks.map(week => ({
        ...week,
        days: week.days.map(day => {
            const dayStart = new Date(day.date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day.date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayEvents = events.filter(event => {
                const eventStart = new Date(event.startDate);
                eventStart.setHours(0, 0, 0, 0);
                const eventEnd = event.endDate 
                    ? new Date(event.endDate)
                    : eventStart;
                eventEnd.setHours(23, 59, 59, 999);
                
                // 检查事件是否在这一天
                return eventStart <= dayEnd && eventEnd >= dayStart;
            });
            
            return {
                ...day,
                events: dayEvents,
            };
        }),
    }));
}

// 格式化时间
export function formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// 格式化日期
export function formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
    });
}

// 月份名称
export const MONTH_NAMES = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
];

// 星期名称
export const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
export const WEEKDAY_NAMES_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

