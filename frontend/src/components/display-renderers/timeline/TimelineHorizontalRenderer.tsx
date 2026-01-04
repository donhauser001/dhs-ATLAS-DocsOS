/**
 * TimelineHorizontalRenderer - 水平时间线渲染器（贪吃蛇布局）
 * 
 * 蛇形排列：第一行从左到右，第二行从右到左，循环往复
 * 使用 flex + 绝对定位 让连接线自动对齐
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag, Rocket, Calendar, Lightbulb, Circle } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import type { AtlasDataBlock } from '../list/types';
import { getStatusColor } from '../list/types';
import { parseFirstAtlasDataBlock } from '../list/parseAtlasData';
import { parseTimelineData, formatMonth, type TimelineEvent } from './types';

// ============================================================
// 常量
// ============================================================

const ITEMS_PER_ROW = 5;

const TYPE_ICONS: Record<string, React.ReactNode> = {
    milestone: <Flag size={14} />,
    release: <Rocket size={14} />,
    event: <Calendar size={14} />,
    decision: <Lightbulb size={14} />,
};

// ============================================================
// 子组件
// ============================================================

interface TimelineCardProps {
    event: TimelineEvent;
    cardSize: number;
}

function TimelineCard({ event, cardSize }: TimelineCardProps) {
    const colors = event.typeOption ? getStatusColor(event.typeOption.color) : getStatusColor('gray');
    const icon = TYPE_ICONS[event.type || ''] || <Circle size={14} />;
    
    const isCompleted = event.progress === 100;
    const isFuture = event.date > new Date();
    
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    
    const handleMouseEnter = () => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setTooltipPos({
                top: rect.bottom + 8,
                left: rect.left + rect.width / 2,
            });
            setShowTooltip(true);
        }
    };
    
    const handleMouseLeave = () => {
        setShowTooltip(false);
    };
    
    const hasTooltipContent = event.description || (event.team && event.team.length > 0);
    
    return (
        <>
            <div 
                ref={cardRef}
                className="relative z-10"
                onMouseEnter={hasTooltipContent ? handleMouseEnter : undefined}
                onMouseLeave={hasTooltipContent ? handleMouseLeave : undefined}
            >
                <div 
                    className={`
                        relative flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer
                        hover:shadow-md
                        ${isFuture 
                            ? 'bg-slate-50 border-dashed border-slate-300' 
                            : isCompleted 
                                ? `bg-white ${colors.border} border-2` 
                                : 'bg-white border-slate-200'
                        }
                    `}
                    style={{ width: cardSize, height: cardSize }}
                >
                    <div className={`
                        flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mb-1.5
                        ${isFuture ? 'bg-slate-100 text-slate-400' : `${colors.bg} ${colors.text}`}
                    `}>
                        {icon}
                    </div>
                    
                    <div className="flex-shrink-0 text-[10px] text-slate-500 mb-0.5">
                        {formatMonth(event.date)}
                    </div>
                    
                    <h4 className="flex-shrink-0 text-xs font-medium text-slate-800 text-center line-clamp-2 leading-tight px-1">
                        {event.title}
                    </h4>
                    
                    {event.typeOption && (
                        <span className={`flex-shrink-0 mt-auto px-1.5 py-0.5 rounded text-[9px] font-medium ${colors.bg} ${colors.text}`}>
                            {event.typeOption.label}
                        </span>
                    )}
                    
                    {isCompleted && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                        </span>
                    )}
                    
                    {event.progress !== undefined && event.progress > 0 && event.progress < 100 && (
                        <div className="flex-shrink-0 w-full mt-auto">
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${colors.bg}`} style={{ width: `${event.progress}%` }} />
                            </div>
                            <div className="text-[9px] text-slate-500 text-center">{event.progress}%</div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 使用 Portal 渲染 Tooltip 到 body */}
            {showTooltip && hasTooltipContent && createPortal(
                <div 
                    className="fixed w-48 p-2.5 bg-white rounded-lg shadow-xl border border-slate-200 z-[9999] pointer-events-none"
                    style={{ 
                        top: tooltipPos.top,
                        left: tooltipPos.left,
                        transform: 'translateX(-50%)',
                    }}
                >
                    {event.description && <p className="text-[10px] text-slate-600 mb-1.5">{event.description}</p>}
                    {event.team && event.team.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {event.team.map((team, idx) => (
                                <span key={idx} className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px]">{team}</span>
                            ))}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}

// ============================================================
// 辅助函数
// ============================================================

// 计算卡片所需的最小尺寸
function calculateCardSize(events: TimelineEvent[]): number {
    // 基础尺寸（图标+日期+标题）
    let baseHeight = 28 + 16 + 32 + 24; // icon + date + title + padding = 100
    
    // 检查是否有进度条
    const hasProgress = events.some(e => e.progress !== undefined && e.progress > 0 && e.progress < 100);
    if (hasProgress) baseHeight += 28;
    
    // 检查是否有类型标签
    const hasTypeOption = events.some(e => e.typeOption);
    if (hasTypeOption) baseHeight += 24;
    
    // 返回正方形尺寸，最小 140px
    return Math.max(140, baseHeight);
}

// ============================================================
// 主组件
// ============================================================

export function TimelineHorizontalRenderer({
    bodyContent,
    className,
}: DisplayRendererProps) {
    const dataBlock = useMemo(() => parseFirstAtlasDataBlock(bodyContent), [bodyContent]);
    
    const events = useMemo(() => {
        if (!dataBlock) return [];
        const extendedBlock = dataBlock as AtlasDataBlock & { dateField?: string; endDateField?: string };
        return parseTimelineData(dataBlock, extendedBlock.dateField || 'date', extendedBlock.endDateField);
    }, [dataBlock]);
    
    const rows = useMemo(() => {
        const result: TimelineEvent[][] = [];
        for (let i = 0; i < events.length; i += ITEMS_PER_ROW) {
            result.push(events.slice(i, i + ITEMS_PER_ROW));
        }
        return result;
    }, [events]);
    
    // 计算统一的卡片尺寸
    const cardSize = useMemo(() => calculateCardSize(events), [events]);
    
    if (!dataBlock) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>未找到数据块，请在文档中添加 atlas-data 代码块</p>
            </div>
        );
    }
    
    const completedCount = events.filter(e => e.progress === 100).length;
    const inProgressCount = events.filter(e => e.progress !== undefined && e.progress > 0 && e.progress < 100).length;
    const futureCount = events.filter(e => e.date > new Date()).length;
    
    // 计算每个单元格的宽度百分比
    const cellWidth = 100 / ITEMS_PER_ROW;
    
    return (
        <div className={`max-w-[1200px] w-full mx-auto px-8 py-6 ${className || ''}`}>
            {/* 统计信息 */}
            <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
                <span>共 <span className="font-medium text-slate-700">{events.length}</span> 个事件</span>
                <span className="text-green-600">{completedCount} 已完成</span>
                {inProgressCount > 0 && <span className="text-purple-600">{inProgressCount} 进行中</span>}
                {futureCount > 0 && <span className="text-slate-400">{futureCount} 待完成</span>}
            </div>
            
            {/* 蛇形时间线 */}
            <div className="relative">
                {rows.map((row, rowIndex) => {
                    const isReversed = rowIndex % 2 === 1;
                    const isLastRow = rowIndex === rows.length - 1;
                    const actualItemCount = row.length;
                    
                    // 填充空位
                    const paddedRow = [...row];
                    while (paddedRow.length < ITEMS_PER_ROW) {
                        paddedRow.push(null as unknown as TimelineEvent);
                    }
                    
                    const displayRow = isReversed ? [...paddedRow].reverse() : paddedRow;
                    
                    return (
                        <div key={rowIndex} className="relative">
                            {/* 事件行 */}
                            <div 
                                className="grid relative"
                                style={{ gridTemplateColumns: `repeat(${ITEMS_PER_ROW}, 1fr)` }}
                            >
                                {displayRow.map((event, displayIndex) => {
                                    const hasEvent = event !== null;
                                    
                                    // 计算在原始数据中的实际索引
                                    const actualDataIndex = isReversed 
                                        ? (ITEMS_PER_ROW - 1 - displayIndex)
                                        : displayIndex;
                                    
                                    const isFirstInData = actualDataIndex === 0;
                                    const isLastInData = actualDataIndex === actualItemCount - 1;
                                    
                                    // 水平线只在卡片之间画，不在最后一个卡片外面画
                                    let showLeftLine = false;
                                    let showRightLine = false;
                                    
                                    if (!isReversed) {
                                        // 正向行：数据从左到右
                                        // 左边有线：不是第一个，且当前位置有数据或前一个有数据
                                        showLeftLine = !isFirstInData && actualDataIndex <= actualItemCount - 1;
                                        // 右边有线：不是最后一个（只在卡片之间画）
                                        showRightLine = actualDataIndex < actualItemCount - 1;
                                    } else {
                                        // 反向行：数据从右到左显示
                                        // 右边有线：不是第一个（数据流的起点在右边）
                                        showRightLine = !isFirstInData && actualDataIndex <= actualItemCount - 1;
                                        // 左边有线：不是最后一个（只在卡片之间画）
                                        showLeftLine = actualDataIndex < actualItemCount - 1;
                                    }
                                    
                                    // 空位不画线
                                    if (actualDataIndex >= actualItemCount) {
                                        showLeftLine = false;
                                        showRightLine = false;
                                    }
                                    
                                    return (
                                        <div 
                                            key={event?.id || `empty-${displayIndex}`} 
                                            className="relative flex items-center justify-center py-3 group/cell"
                                        >
                                            {/* 水平连接线 - 左半边 */}
                                            {showLeftLine && (
                                                <div className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-slate-300 -translate-y-1/2 z-0" />
                                            )}
                                            
                                            {/* 水平连接线 - 右半边 */}
                                            {showRightLine && (
                                                <div className="absolute top-1/2 right-0 w-1/2 h-[2px] bg-slate-300 -translate-y-1/2 z-0" />
                                            )}
                                            
                                            {/* 卡片 */}
                                            {hasEvent && (
                                                <TimelineCard event={event} cardSize={cardSize} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* 行间垂直连接线 */}
                            {!isLastRow && (
                                <div 
                                    className="absolute w-[2px] bg-slate-300 z-0"
                                    style={{ 
                                        top: '50%',
                                        height: 'calc(50% + 24px + 50%)',
                                        // 正向行：垂直线在最后一个实际卡片的位置
                                        // 反向行：垂直线在最后一个实际卡片的位置（左边第一列）
                                        left: isReversed 
                                            ? `calc(${cellWidth / 2}%)`  // 左侧第一列中心
                                            : `calc(${(actualItemCount - 0.5) * cellWidth}%)`, // 最后一个实际卡片的中心
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* 图例 */}
            <div className="mt-8 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">图例:</span>
                    {[
                        { icon: <Flag size={12} />, label: '里程碑', color: 'purple' },
                        { icon: <Rocket size={12} />, label: '发布', color: 'green' },
                        { icon: <Calendar size={12} />, label: '事件', color: 'blue' },
                        { icon: <Lightbulb size={12} />, label: '决策', color: 'orange' },
                    ].map(item => {
                        const colors = getStatusColor(item.color);
                        return (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${colors.bg} ${colors.text}`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </div>
                        );
                    })}
                    <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                        <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</span>
                        <span>已完成</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 border-2 border-dashed border-slate-300 rounded-full" />
                        <span>未来计划</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TimelineHorizontalRenderer;
