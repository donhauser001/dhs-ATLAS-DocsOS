/**
 * Tags 组件 - 数据块控件
 * 支持添加、删除标签，可预设建议选项
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, TagsComponentDefinition } from '../../types';

// 预设颜色
const TAG_COLORS = [
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-green-100 text-green-700 border-green-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-orange-100 text-orange-700 border-orange-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
];

// 根据标签名生成稳定的颜色
function getTagColor(tag: string): string {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const tagsDef = component as TagsComponentDefinition;
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 解析当前标签
    const tags: string[] = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) return value as string[];
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
            }
        }
        return [];
    }, [value]);

    // 过滤建议（排除已选择的）
    const filteredSuggestions = useMemo(() => {
        if (!tagsDef.suggestions) return [];
        return tagsDef.suggestions.filter(
            s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [tagsDef.suggestions, tags, inputValue]);

    const updateTags = useCallback((newTags: string[]) => {
        onChange(newTags.length > 0 ? JSON.stringify(newTags) : null);
    }, [onChange]);

    const handleAddTag = useCallback((tag: string) => {
        const trimmed = tag.trim();
        if (!trimmed) return;
        if (tags.includes(trimmed)) return;
        if (tagsDef.maxTags && tags.length >= tagsDef.maxTags) return;
        
        updateTags([...tags, trimmed]);
        setInputValue('');
        setShowSuggestions(false);
    }, [tags, tagsDef.maxTags, updateTags]);

    const handleRemoveTag = useCallback((tag: string) => {
        updateTags(tags.filter(t => t !== tag));
    }, [tags, updateTags]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagsDef.allowCreate !== false && inputValue.trim()) {
                handleAddTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            // 删除最后一个标签
            handleRemoveTag(tags[tags.length - 1]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div className="space-y-2">
            {/* 已选标签 */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border',
                                getTagColor(tag)
                            )}
                        >
                            <Tag className="h-3 w-3" />
                            {tag}
                            {!disabled && (
                                <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:opacity-70 ml-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* 输入框 */}
            {!disabled && (
                <div className="relative">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder={tagsDef.placeholder || '输入标签后按回车添加...'}
                                disabled={tagsDef.maxTags ? tags.length >= tagsDef.maxTags : false}
                                className={cn(
                                    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg',
                                    'focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400',
                                    'disabled:bg-slate-50 disabled:text-slate-400'
                                )}
                            />
                            
                            {/* 建议下拉 */}
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                                    {filteredSuggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => handleAddTag(suggestion)}
                                            className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Plus className="h-3 w-3 text-slate-400" />
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {tagsDef.allowCreate !== false && inputValue.trim() && (
                            <button
                                type="button"
                                onClick={() => handleAddTag(inputValue)}
                                className="px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                添加
                            </button>
                        )}
                    </div>
                    
                    {/* 提示信息 */}
                    {tagsDef.maxTags && (
                        <p className="mt-1 text-xs text-slate-400">
                            {tags.length}/{tagsDef.maxTags} 个标签
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default Control;

