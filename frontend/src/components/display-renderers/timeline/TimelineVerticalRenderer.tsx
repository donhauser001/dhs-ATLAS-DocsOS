/**
 * TimelineVerticalRenderer - 垂直时间线渲染器
 * 
 * 从上到下按时间顺序排列，左右交替显示事件卡片
 */

import { useMemo } from 'react';
import { Flag, Rocket, Calendar, Lightbulb, Circle, Tag } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { getStatusColor } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import { parseTimelineData, formatTimelineDate, type TimelineEvent } from './types';

// ============================================================
// 子组件
// ============================================================

const TYPE_ICONS: Record<string, React.ReactNode> = {
    milestone: <Flag size={16} />,
    release: <Rocket size={16} />,
    event: <Calendar size={16} />,
    decision: <Lightbulb size={16} />,
};

interface TimelineCardProps {
    event: TimelineEvent;
    position: 'left' | 'right';
}

function TimelineCard({ event, position }: TimelineCardProps) {
    const colors = event.typeOption ? getStatusColor(event.typeOption.color) : getStatusColor('gray');
    const icon = TYPE_ICONS[event.type || ''] || <Circle size={16} />;
    
    const isCompleted = event.progress === 100;
    const isFuture = event.date > new Date();
    
    return (
        <div className={`flex items-start gap-4 ${position === 'right' ? 'flex-row-reverse text-right' : ''}`}>
            {/* 卡片 */}
            <div className={`flex-1 max-w-md ${position === 'right' ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow ${
                    isFuture ? 'border-dashed border-slate-300 opacity-70' : 'border-slate-200'
                }`}>
                    {/* 类型标签 */}
                    <div className={`flex items-center gap-2 mb-2 ${position === 'right' ? 'justify-end' : ''}`}>
                        {event.typeOption && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {icon}
                                {event.typeOption.label}
                            </span>
                        )}
                        {isCompleted && (
                            <span className="text-xs text-green-600">✓ 已完成</span>
                        )}
                    </div>
                    
                    {/* 标题 */}
                    <h4 className="text-base font-medium text-slate-800 mb-1">
                        {event.title}
                    </h4>
                    
                    {/* 日期 */}
                    <div className="text-sm text-slate-500 mb-2">
                        {formatTimelineDate(event.date)}
                        {event.endDate && (
                            <span> ~ {formatTimelineDate(event.endDate)}</span>
                        )}
                    </div>
                    
                    {/* 描述 */}
                    {event.description && (
                        <p className="text-sm text-slate-600 mb-3">
                            {event.description}
                        </p>
                    )}
                    
                    {/* 进度条 */}
                    {event.progress !== undefined && event.progress > 0 && event.progress < 100 && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span>进度</span>
                                <span>{event.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all"
                                    style={{ width: `${event.progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* 团队标签 */}
                    {event.team && event.team.length > 0 && (
                        <div className={`flex flex-wrap gap-1 ${position === 'right' ? 'justify-end' : ''}`}>
                            {event.team.map((team, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                                >
                                    <Tag size={10} />
                                    {team}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TimelineNodeProps {
    event: TimelineEvent;
}

function TimelineNode({ event }: TimelineNodeProps) {
    const colors = event.typeOption ? getStatusColor(event.typeOption.color) : getStatusColor('gray');
    const isCompleted = event.progress === 100;
    const isFuture = event.date > new Date();
    
    return (
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            isCompleted 
                ? `${colors.bg} ${colors.border} border-2`
                : isFuture 
                    ? 'bg-white border-dashed border-slate-300'
                    : `${colors.bg} ${colors.border} border-2`
        }`}>
            <span className={isCompleted || !isFuture ? colors.text : 'text-slate-400'}>
                {TYPE_ICONS[event.type || ''] || <Circle size={16} />}
            </span>
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function TimelineVerticalRenderer({
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
            extendedBlock.endDateField
        );
    }, [dataBlock]);
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    // 统计
    const completedCount = events.filter(e => e.progress === 100).length;
    const futureCount = events.filter(e => e.date > new Date()).length;
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 统计信息 */}
            <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
                <span>共 <span className="font-medium text-slate-700">{events.length}</span> 个事件</span>
                <span>·</span>
                <span className="text-green-600">{completedCount} 已完成</span>
                <span>·</span>
                <span className="text-slate-400">{futureCount} 待完成</span>
            </div>
            
            {/* 时间线 */}
            <div className="relative">
                {/* 中间的竖线 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2" />
                
                {/* 事件列表 */}
                <div className="space-y-8">
                    {events.map((event, index) => (
                        <div key={event.id} className="relative flex items-center">
                            {/* 左侧卡片 */}
                            <div className="flex-1 pr-8">
                                {index % 2 === 0 && (
                                    <TimelineCard event={event} position="left" />
                                )}
                            </div>
                            
                            {/* 中间节点 */}
                            <div className="relative z-10">
                                <TimelineNode event={event} />
                            </div>
                            
                            {/* 右侧卡片 */}
                            <div className="flex-1 pl-8">
                                {index % 2 === 1 && (
                                    <TimelineCard event={event} position="right" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TimelineVerticalRenderer;

