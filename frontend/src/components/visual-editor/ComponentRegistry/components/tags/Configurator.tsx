/**
 * Tags 组件 - 配置表单
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ConfiguratorProps, TagsComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const tagsData = formData as TagsComponentDefinition;
    const [newSuggestion, setNewSuggestion] = useState('');

    const handleAddSuggestion = () => {
        if (!newSuggestion.trim()) return;
        const suggestions = tagsData.suggestions || [];
        if (suggestions.includes(newSuggestion.trim())) return;
        
        onUpdateFormData((prev) => ({
            ...prev,
            suggestions: [...suggestions, newSuggestion.trim()],
        }));
        setNewSuggestion('');
    };

    const handleRemoveSuggestion = (suggestion: string) => {
        onUpdateFormData((prev) => ({
            ...prev,
            suggestions: (prev as TagsComponentDefinition).suggestions?.filter(s => s !== suggestion),
        }));
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">占位文本</label>
                <input
                    type="text"
                    value={tagsData.placeholder || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            placeholder: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="输入标签后按回车添加..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    最大标签数量（可选）
                </label>
                <input
                    type="number"
                    value={tagsData.maxTags || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            maxTags: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                    }
                    min={1}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="不限制"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="allowCreate"
                    checked={tagsData.allowCreate !== false}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            allowCreate: e.target.checked,
                        }))
                    }
                    className="w-4 h-4 text-purple-500 rounded border-slate-300"
                />
                <label htmlFor="allowCreate" className="text-sm text-slate-700">
                    允许创建新标签
                </label>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    预设标签选项
                </label>
                
                {/* 已有的预设标签 */}
                {tagsData.suggestions && tagsData.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {tagsData.suggestions.map((suggestion) => (
                            <span
                                key={suggestion}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded"
                            >
                                {suggestion}
                                <button
                                    onClick={() => handleRemoveSuggestion(suggestion)}
                                    className="hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* 添加新预设 */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newSuggestion}
                        onChange={(e) => setNewSuggestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSuggestion())}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="输入预设标签"
                    />
                    <button
                        type="button"
                        onClick={handleAddSuggestion}
                        className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        添加
                    </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    预设标签会在输入时作为建议显示
                </p>
            </div>
        </div>
    );
}

export default Configurator;

