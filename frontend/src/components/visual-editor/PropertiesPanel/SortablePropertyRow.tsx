/**
 * SortablePropertyRow - 可拖拽排序的系统属性行
 * 使用系统标签映射获取颜色
 * 支持多种属性类型：文本、日期、标签、文档类型、功能类型、显现模式、能力
 */

import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Lock, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import type { SortablePropertyRowProps } from './types';
import { formatDateDisplay, getColorClasses, getDefaultTagColor } from './utils';
import { FunctionTypeSelector } from '@/components/ui/function-type-selector';
import { DisplayModeMultiSelect } from '@/components/ui/display-mode-multi-select';
import { CapabilityMultiSelect } from '@/components/ui/capability-multi-select';
import { TypePackageDisplay } from './TypePackageDisplay';

export function SortablePropertyRow({
    id,
    icon,
    label,
    type,
    value,
    onChange,
    readonly = false,
    disabled = false,
    wide = false,
}: SortablePropertyRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // 渲染值编辑器
    const renderValueEditor = () => {
        // 日期类型
        if (type === 'date') {
            const dateStr = value ? String(value) : '';
            const formatted = formatDateDisplay(dateStr);

            if (readonly) {
                return <span className="text-xs text-slate-600">{formatted}</span>;
            }

            return (
                <input
                    type="date"
                    value={dateStr.split('T')[0] || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="text-xs bg-transparent border-none outline-none text-slate-800 w-full"
                />
            );
        }

        // 标签类型 - 使用系统标签映射获取颜色
        if (type === 'tags') {
            const tags = Array.isArray(value)
                ? value
                : typeof value === 'string'
                    ? value.split(',').map(s => s.trim()).filter(Boolean)
                    : [];

            return (
                <TagsRenderer
                    tags={tags}
                    readonly={readonly}
                    onChange={onChange}
                />
            );
        }

        // 文档类型 - 静态显示类型包名称
        if (type === 'doc-type') {
            return <TypePackageDisplay value={String(value || '')} />;
        }

        // 功能类型选择器
        if (type === 'function-type') {
            return (
                <FunctionTypeSelector
                    value={String(value || '')}
                    onChange={(v) => onChange(v)}
                    disabled={readonly || disabled}
                    compact
                />
            );
        }

        // 显现模式多选
        if (type === 'display-modes') {
            const modes = Array.isArray(value) ? value : [];
            return (
                <DisplayModeMultiSelect
                    value={modes.map(String)}
                    onChange={(v) => onChange(v)}
                    disabled={readonly || disabled}
                />
            );
        }

        // 能力类型多选
        if (type === 'capabilities') {
            const caps = Array.isArray(value) ? value : [];
            return (
                <CapabilityMultiSelect
                    value={caps.map(String)}
                    onChange={(v) => onChange(v)}
                    disabled={readonly || disabled}
                />
            );
        }

        // 默认文本类型 - 使用 TextInput 组件，失去焦点时才提交
        if (readonly) {
            return <span className="text-xs text-slate-600">{String(value || '—')}</span>;
        }

        return (
            <TextInput
                value={String(value || '')}
                onChange={onChange}
            />
        );
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100",
                "hover:border-slate-200 hover:bg-slate-50/50 transition-colors group",
                wide && "col-span-full",
                isDragging && "opacity-50 shadow-lg z-10"
            )}
        >
            {/* 拖拽手柄 */}
            {!disabled && (
                <div
                    {...attributes}
                    {...listeners}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </div>
            )}

            {/* 图标 */}
            <div className="flex-shrink-0">{icon}</div>

            {/* 标签 */}
            <div className="flex-shrink-0 flex items-center gap-1">
                <span className="text-xs text-slate-500">{label}</span>
                {readonly && <Lock className="w-2.5 h-2.5 text-slate-300" />}
            </div>

            {/* 分隔符 */}
            <span className="text-slate-300">:</span>

            {/* 值 */}
            <div className="flex-1 min-w-0">{renderValueEditor()}</div>
        </div>
    );
}

/**
 * 标签渲染器 - 使用系统标签映射获取颜色
 */
interface TagsRendererProps {
    tags: unknown[];
    readonly: boolean;
    onChange: (value: unknown) => void;
}

function TagsRenderer({ tags, readonly, onChange }: TagsRendererProps) {
    const { getColor } = useLabels();

    return (
        <div className="flex flex-wrap items-center gap-1">
            {tags.map((tag, idx) => {
                const tagStr = String(tag);
                // 优先使用系统标签颜色，否则使用默认轮换颜色
                const systemColor = getColor(tagStr);
                const colorClasses = systemColor
                    ? getColorClasses(systemColor)
                    : getDefaultTagColor(idx);

                return (
                    <span
                        key={tagStr}
                        className={cn(
                            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
                            colorClasses.bg,
                            colorClasses.text,
                            'border',
                            colorClasses.border
                        )}
                    >
                        {tagStr}
                        {!readonly && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newTags = tags.filter((_, i) => i !== idx);
                                    onChange(newTags);
                                }}
                                className="hover:opacity-70 transition-opacity"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </span>
                );
            })}
            {!readonly && (
                <input
                    type="text"
                    placeholder="添加..."
                    className="text-xs bg-transparent border-none outline-none w-12 placeholder:text-slate-300"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const newTag = input.value.trim();
                            if (newTag && !tags.map(t => String(t)).includes(newTag)) {
                                onChange([...tags, newTag]);
                                input.value = '';
                            }
                        }
                    }}
                />
            )}
            {tags.length === 0 && readonly && (
                <span className="text-xs text-slate-400">—</span>
            )}
        </div>
    );
}

export default SortablePropertyRow;

/**
 * 文本输入组件 - 只在失去焦点或按回车时提交更改
 * 避免每次输入都触发父组件更新（例如重命名文件）
 */
interface TextInputProps {
    value: string;
    onChange: (value: unknown) => void;
}

function TextInput({ value, onChange }: TextInputProps) {
    const [localValue, setLocalValue] = useState(value);

    // 当外部 value 变化时同步本地状态
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (localValue !== value) {
                onChange(localValue);
            }
            e.currentTarget.blur();
        }
    };

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full text-xs bg-transparent border-none outline-none placeholder:text-slate-300 text-slate-800"
        />
    );
}
