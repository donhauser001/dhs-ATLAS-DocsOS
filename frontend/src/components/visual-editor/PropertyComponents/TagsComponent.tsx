/**
 * TagsComponent - 关键词/标签属性组件
 * 
 * 支持多个标签输入，每个标签显示为彩色标签
 */

import React, { useState, useCallback, KeyboardEvent } from 'react';
import { Tags, X, Plus, AlertTriangle } from 'lucide-react';
import type { PropertyComponent, PropertyComponentConfig, PropertyRenderContext, ValidationResult } from '@/types/property';
import { COMPONENT_STYLES } from './types';

// 标签颜色列表
const TAG_COLORS = [
    { bg: 'bg-purple-100', text: 'text-purple-700', hover: 'hover:bg-purple-200' },
    { bg: 'bg-blue-100', text: 'text-blue-700', hover: 'hover:bg-blue-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', hover: 'hover:bg-emerald-200' },
    { bg: 'bg-amber-100', text: 'text-amber-700', hover: 'hover:bg-amber-200' },
    { bg: 'bg-pink-100', text: 'text-pink-700', hover: 'hover:bg-pink-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', hover: 'hover:bg-cyan-200' },
];

function getTagColor(index: number) {
    return TAG_COLORS[index % TAG_COLORS.length];
}

// === 渲染函数 ===

function renderConfig(
    config: PropertyComponentConfig,
    onChange: (config: PropertyComponentConfig) => void
): React.ReactNode {
    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    占位文本
                </label>
                <input
                    type="text"
                    value={config.placeholder || ''}
                    onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
                    placeholder="添加标签..."
                    className={COMPONENT_STYLES.input}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    最大标签数
                </label>
                <input
                    type="number"
                    value={config.maxTags || ''}
                    onChange={(e) => onChange({ ...config, maxTags: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="不限制"
                    min={1}
                    className={COMPONENT_STYLES.input}
                />
            </div>
        </div>
    );
}

function TagEditorInternal({
    tags,
    onChange,
    disabled,
    placeholder,
    maxTags,
}: {
    tags: string[];
    onChange: (tags: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    maxTags?: number;
}) {
    const [inputValue, setInputValue] = useState('');

    const handleAddTag = useCallback(() => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;
        if (tags.includes(trimmedValue)) {
            setInputValue('');
            return;
        }
        if (maxTags && tags.length >= maxTags) return;

        onChange([...tags, trimmedValue]);
        setInputValue('');
    }, [inputValue, tags, onChange, maxTags]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    }, [tags, onChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            handleRemoveTag(tags[tags.length - 1]);
        }
    }, [inputValue, tags, handleAddTag, handleRemoveTag]);

    const canAddMore = !maxTags || tags.length < maxTags;

    return (
        <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
            {tags.map((tag, index) => {
                const color = getTagColor(index);
                return (
                    <span
                        key={tag}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color.bg} ${color.text}`}
                    >
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className={`p-0.5 rounded ${color.hover} transition-colors`}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </span>
                );
            })}
            {!disabled && canAddMore && (
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleAddTag}
                    placeholder={tags.length === 0 ? (placeholder || '添加标签...') : ''}
                    className="flex-1 min-w-[80px] px-1 py-0.5 text-xs bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400"
                />
            )}
        </div>
    );
}

function renderEditor(
    value: unknown,
    config: PropertyComponentConfig,
    onChange: (value: unknown) => void,
    context?: PropertyRenderContext
): React.ReactNode {
    const tags = Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];
    const disabled = context?.disabled || context?.readonly;

    return (
        <TagEditorInternal
            tags={tags}
            onChange={onChange}
            disabled={disabled}
            placeholder={config.placeholder}
            maxTags={config.maxTags}
        />
    );
}

function renderView(
    value: unknown,
    _config: PropertyComponentConfig,
    _context?: PropertyRenderContext
): React.ReactNode {
    const tags = Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];

    if (tags.length === 0) {
        return <span className="text-slate-400 text-sm">-</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => {
                const color = getTagColor(index);
                return (
                    <span
                        key={tag}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color.bg} ${color.text}`}
                    >
                        {tag}
                    </span>
                );
            })}
        </div>
    );
}

function renderInline(
    value: unknown,
    _config: PropertyComponentConfig
): React.ReactNode {
    const tags = Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];

    if (tags.length === 0) {
        return <span className={COMPONENT_STYLES.inline}>无标签</span>;
    }

    return (
        <span className={COMPONENT_STYLES.inline}>
            <Tags size={12} />
            {tags.length} 个标签
        </span>
    );
}

function renderFallback(
    lastValue: unknown,
    _config: unknown
): React.ReactNode {
    return (
        <div className={COMPONENT_STYLES.fallback}>
            <AlertTriangle size={16} />
            <span>标签组件不可用</span>
            {lastValue !== undefined && Array.isArray(lastValue) && (
                <span className="text-amber-600">最后值: {lastValue.join(', ')}</span>
            )}
        </div>
    );
}

function validate(
    value: unknown,
    config: PropertyComponentConfig
): ValidationResult {
    if (!Array.isArray(value)) {
        return { valid: true };
    }
    if (config.maxTags && value.length > config.maxTags) {
        return { valid: false, message: `标签数量不能超过 ${config.maxTags} 个` };
    }
    return { valid: true };
}

function serialize(value: unknown): string {
    if (!Array.isArray(value)) return '';
    return value.join(',');
}

function deserialize(str: string): unknown {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
}

// === 组件定义 ===

export const TagsComponent: PropertyComponent = {
    id: 'tags',
    version: '1.0.0',
    name: '关键词',
    icon: 'tags',
    description: '多个标签/关键词输入',

    defaultConfig: {
        placeholder: '添加标签...',
    },

    renderConfig,
    renderEditor,
    renderView,
    renderInline,
    renderFallback,
    validate,
    serialize,
    deserialize,
};

export default TagsComponent;

