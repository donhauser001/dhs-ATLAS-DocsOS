/**
 * IdCard 组件 - 数据块控件
 */

import { useState } from 'react';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, IdCardComponentDefinition } from '../../types';

// 验证身份证号 (简化版，支持15/18位)
function isValidIdCard(value: string): boolean {
    return /^(\d{15}|\d{17}[\dXx])$/.test(value);
}

// 格式化显示：遮罩中间部分
function maskIdCard(value: string): string {
    if (value.length <= 6) return value;
    const start = value.slice(0, 6);
    const end = value.slice(-4);
    const masked = '*'.repeat(Math.max(0, value.length - 10));
    return `${start}${masked}${end}`;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const idCardDef = component as IdCardComponentDefinition;
    const [showFull, setShowFull] = useState(false);
    const [focused, setFocused] = useState(false);
    
    const stringValue = typeof value === 'string' ? value : '';
    const isValid = !stringValue || isValidIdCard(stringValue);
    const shouldMask = idCardDef.masked && !showFull && !focused && stringValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\dXx]/g, '').slice(0, 18).toUpperCase();
        onChange(raw || null);
    };

    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <CreditCard className="h-4 w-4" />
            </div>
            <input
                type="text"
                value={shouldMask ? maskIdCard(stringValue) : stringValue}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={disabled}
                placeholder={idCardDef.placeholder || '请输入身份证号'}
                maxLength={18}
                className={cn(
                    'w-full pl-10 pr-10 py-2 text-sm border rounded-lg font-mono',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                    !isValid && stringValue && 'border-red-300 focus:ring-red-400/50',
                    isValid && 'border-slate-200 focus:border-purple-400',
                    disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                )}
            />
            {idCardDef.masked && stringValue && !focused && (
                <button
                    type="button"
                    onClick={() => setShowFull(!showFull)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    {showFull ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            )}
            {!isValid && stringValue && (
                <p className="mt-1 text-xs text-red-500">请输入正确的身份证号</p>
            )}
        </div>
    );
}

export default Control;

