/**
 * RelationPicker 组件 - 数据块控件
 */

import { useState } from 'react';
import { Link2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, RelationPickerComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const relationDef = component as RelationPickerComponentDefinition;
    const [showPicker, setShowPicker] = useState(false);

    const stringValue = typeof value === 'string' ? value : '';
    const arrayValue = Array.isArray(value) ? value : stringValue ? [stringValue] : [];

    const handleSelect = (selectedValue: string) => {
        if (relationDef.multiple) {
            const newValue = arrayValue.includes(selectedValue)
                ? arrayValue.filter(v => v !== selectedValue)
                : [...arrayValue, selectedValue];
            onChange(newValue.length > 0 ? newValue : null);
        } else {
            onChange(selectedValue);
            setShowPicker(false);
        }
    };

    const handleRemove = (val: string) => {
        if (relationDef.multiple) {
            const newValue = arrayValue.filter(v => v !== val);
            onChange(newValue.length > 0 ? newValue : null);
        } else {
            onChange(null);
        }
    };

    return (
        <div className="space-y-2">
            {/* 已选项 */}
            {arrayValue.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {arrayValue.map((val) => (
                        <div
                            key={val}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                            <Link2 className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-slate-700">{val}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(val)}
                                    className="p-0.5 text-slate-400 hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 选择按钮 */}
            {!disabled && (relationDef.multiple || arrayValue.length === 0) && (
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm',
                        'border border-dashed border-slate-300 rounded-lg',
                        'hover:border-blue-300 hover:bg-blue-50/50 transition-colors',
                        'text-slate-500'
                    )}
                >
                    <Search className="h-4 w-4" />
                    选择关联...
                </button>
            )}

            {/* 提示信息 */}
            {showPicker && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">
                        索引: {relationDef.index || '未配置'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        请在配置中设置关联索引
                    </p>
                </div>
            )}
        </div>
    );
}

export default Control;

