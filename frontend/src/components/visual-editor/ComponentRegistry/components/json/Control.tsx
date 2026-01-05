/**
 * JSON 组件 - 数据块控件
 */

import { useState, useMemo } from 'react';
import { Braces, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, JsonComponentDefinition } from '../../types';

/** 验证 JSON */
export function validateJson(str: string): { valid: boolean; error?: string } {
    if (!str.trim()) return { valid: true };
    
    try {
        JSON.parse(str);
        return { valid: true };
    } catch (e) {
        return { valid: false, error: e instanceof Error ? e.message : 'JSON 格式错误' };
    }
}

/** 格式化 JSON */
export function formatJson(str: string): string {
    try {
        return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
        return str;
    }
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const jsonDef = component as JsonComponentDefinition;
    const [isFocused, setIsFocused] = useState(false);

    const stringValue = typeof value === 'string' ? value : 
        value !== null && value !== undefined ? JSON.stringify(value, null, 2) : '';

    const validation = useMemo(() => validateJson(stringValue), [stringValue]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value || null);
    };

    const handleFormat = () => {
        if (validation.valid && stringValue) {
            onChange(formatJson(stringValue));
        }
    };

    return (
        <div className="space-y-2">
            <div className={cn(
                'relative border rounded-lg overflow-hidden',
                isFocused ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-slate-200',
                !validation.valid && stringValue && 'border-red-300'
            )}>
                {/* 工具栏 */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Braces className="h-3.5 w-3.5" />
                        <span>JSON</span>
                    </div>
                    {validation.valid && stringValue && (
                        <button
                            type="button"
                            onClick={handleFormat}
                            disabled={disabled || jsonDef.readOnly}
                            className="text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                        >
                            格式化
                        </button>
                    )}
                </div>

                {/* 编辑区 */}
                <textarea
                    value={stringValue}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={disabled || jsonDef.readOnly}
                    spellCheck={false}
                    className={cn(
                        'w-full px-3 py-2 text-sm font-mono resize-none',
                        'focus:outline-none',
                        (disabled || jsonDef.readOnly) && 'bg-slate-50 text-slate-500 cursor-not-allowed'
                    )}
                    style={{
                        minHeight: jsonDef.minHeight || 150,
                        maxHeight: jsonDef.maxHeight || 400,
                    }}
                />
            </div>

            {/* 验证状态 */}
            <div className="flex items-center gap-2 text-xs">
                {stringValue && (
                    validation.valid ? (
                        <span className="flex items-center gap-1 text-green-600">
                            <Check className="h-3 w-3" />
                            JSON 格式正确
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            {validation.error}
                        </span>
                    )
                )}
            </div>
        </div>
    );
}

export default Control;

