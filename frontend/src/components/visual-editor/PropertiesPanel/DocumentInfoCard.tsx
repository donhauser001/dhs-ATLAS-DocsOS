/**
 * DocumentInfoCard - 阅读模式下的文档信息卡片
 * 
 * Phase 4.0.2 重构：简洁优雅的头部设计
 * - 只显示核心信息：标题、作者、时间、标签
 * - 移除技术配置信息（文档类型、功能类型、能力等）
 * - 聚焦阅读体验
 */

import { useMemo } from 'react';
import { User, Calendar, Tag, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import { formatRelativeTime, formatDateDisplay } from './utils';
import { COLOR_CLASSES, getDefaultTagColor } from './utils';

export interface DocumentInfoCardProps {
    /** 文档 frontmatter */
    frontmatter: Record<string, unknown>;
    /** 点击编辑按钮的回调 */
    onEditClick?: () => void;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 额外的样式类 */
    className?: string;
}

export function DocumentInfoCard({
    frontmatter,
    onEditClick,
    compact = false,
    className,
}: DocumentInfoCardProps) {
    const { getColor } = useLabels();

    // 解析基础信息
    const title = frontmatter.title as string || '未命名文档';
    const author = frontmatter.author as string || '';
    const created = (frontmatter.created_at || frontmatter.created) as string || '';
    const updated = (frontmatter.updated_at || frontmatter.updated) as string || '';
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

    // 时间显示：优先显示更新时间，否则显示创建时间
    const timeDisplay = useMemo(() => {
        const time = updated || created;
        if (!time) return null;
        return formatRelativeTime(time);
    }, [created, updated]);

    const timeTitle = useMemo(() => {
        if (updated) return `更新于 ${formatDateDisplay(updated)}`;
        if (created) return `创建于 ${formatDateDisplay(created)}`;
        return '';
    }, [created, updated]);

    return (
        <div className={cn("border-b border-slate-100", className)}>
            <div className={cn("px-6", compact ? "py-4" : "py-5")}>
                {/* 标题行 */}
                <div className="flex items-start justify-between gap-4">
                    <h1 className={cn(
                        "font-semibold text-slate-800 leading-tight",
                        compact ? "text-lg" : "text-xl"
                    )}>
                        {title}
                    </h1>

                    {/* 编辑按钮 */}
                    {onEditClick && (
                        <button
                            type="button"
                            onClick={onEditClick}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 
                                     hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            <Edit3 size={14} />
                            编辑
                        </button>
                    )}
                </div>

                {/* 元信息行：作者 · 时间 */}
                {(author || timeDisplay) && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                        {author && (
                            <span className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-400" />
                                {author}
                            </span>
                        )}
                        {author && timeDisplay && (
                            <span className="text-slate-300">·</span>
                        )}
                        {timeDisplay && (
                            <span
                                className="flex items-center gap-1.5"
                                title={timeTitle}
                            >
                                <Calendar size={13} className="text-slate-400" />
                                {timeDisplay}
                            </span>
                        )}
                    </div>
                )}

                {/* 标签行 */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {tags.map((tag, idx) => {
                            const tagStr = String(tag);
                            const systemColor = getColor(tagStr);
                            const colorClasses = systemColor
                                ? COLOR_CLASSES[systemColor] || COLOR_CLASSES.slate
                                : getDefaultTagColor(idx);

                            return (
                                <span
                                    key={tagStr}
                                    className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                        colorClasses.bg,
                                        colorClasses.text,
                                    )}
                                >
                                    <Tag size={10} />
                                    {tagStr}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentInfoCard;
