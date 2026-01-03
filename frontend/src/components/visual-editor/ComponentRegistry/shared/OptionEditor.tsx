/**
 * OptionEditor - 选项编辑器
 * 多个选择类组件共用
 */

import { useCallback } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComponentOption } from '../types';

interface OptionEditorProps {
    options: ComponentOption[];
    onChange: (options: ComponentOption[]) => void;
}

export function OptionEditor({ options, onChange }: OptionEditorProps) {
    const addOption = useCallback(() => {
        onChange([...options, { value: `选项 ${options.length + 1}` }]);
    }, [options, onChange]);

    const updateOption = useCallback(
        (index: number, value: string) => {
            const newOptions = [...options];
            newOptions[index] = { ...newOptions[index], value };
            onChange(newOptions);
        },
        [options, onChange]
    );

    const removeOption = useCallback(
        (index: number) => {
            if (options.length <= 1) return;
            const newOptions = options.filter((_, i) => i !== index);
            onChange(newOptions);
        },
        [options, onChange]
    );

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
                选项列表
            </label>

            {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />
                    <input
                        type="text"
                        value={option.value}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder="输入选项名称"
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                    />
                    <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 1}
                        className={cn(
                            'p-1 rounded hover:bg-red-50 transition-colors',
                            options.length <= 1
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-500'
                        )}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
            >
                <Plus size={14} />
                添加选项
            </button>
        </div>
    );
}

export default OptionEditor;

