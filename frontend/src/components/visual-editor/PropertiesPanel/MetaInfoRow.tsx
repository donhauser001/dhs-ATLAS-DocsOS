/**
 * MetaInfoRow - 元信息行组件
 * 显示作者、时间和标签
 */

import { User, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import { formatRelativeTime, formatDateDisplay, COLOR_CLASSES, getDefaultTagColor } from './utils';

interface MetaInfoRowProps {
    frontmatter: Record<string, unknown>;
}

export function MetaInfoRow({ frontmatter }: MetaInfoRowProps) {
    const { getColor } = useLabels();

    const author = frontmatter.author as string || '';
    const created = (frontmatter.created_at || frontmatter.created) as string || '';
    const updated = (frontmatter.updated_at || frontmatter.updated) as string || '';
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

    // 时间显示：优先显示更新时间
    const timeDisplay = updated ? formatRelativeTime(updated) : (created ? formatRelativeTime(created) : null);
    const timeTitle = updated ? `更新于 ${formatDateDisplay(updated)}` : (created ? `创建于 ${formatDateDisplay(created)}` : '');

    const hasMetaInfo = author || timeDisplay || tags.length > 0;

    if (!hasMetaInfo) return null;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* 作者 */}
            {author && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <User size={13} className="text-slate-400" />
                    {author}
                </span>
            )}

            {/* 分隔点 */}
            {author && timeDisplay && <span className="text-slate-300 text-sm">·</span>}

            {/* 时间 */}
            {timeDisplay && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500" title={timeTitle}>
                    <Calendar size={13} className="text-slate-400" />
                    {timeDisplay}
                </span>
            )}

            {/* 分隔点 */}
            {(author || timeDisplay) && tags.length > 0 && <span className="text-slate-300 text-sm">·</span>}

            {/* 标签 */}
            {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
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
    );
}

export default MetaInfoRow;
