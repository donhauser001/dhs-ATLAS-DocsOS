/**
 * Phone 组件 - 数据块控件
 */

import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, PhoneComponentDefinition } from '../../types';

// 手机号格式化：138 1234 5678
function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

// 验证手机号
function isValidPhone(value: string): boolean {
    const digits = value.replace(/\D/g, '');
    return /^1[3-9]\d{9}$/.test(digits);
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const phoneDef = component as PhoneComponentDefinition;
    
    // 确保 value 转为字符串
    const stringValue = value === null || value === undefined ? '' : String(value);
    const isValid = !stringValue || isValidPhone(stringValue);

    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Phone className="h-4 w-4" />
            </div>
            <input
                type="text"
                inputMode="tel"
                value={formatPhone(stringValue)}
                onChange={(e) => {
                    // 只保留数字，最多11位
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                    onChange(raw);
                }}
                disabled={disabled}
                placeholder={phoneDef.placeholder || '请输入手机号'}
                className={cn(
                    'w-full pl-10 pr-3 py-2 text-sm border rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                    !isValid && stringValue && 'border-red-300 focus:ring-red-400/50',
                    isValid && 'border-slate-200 focus:border-purple-400',
                    disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                )}
            />
            {!isValid && stringValue && (
                <p className="mt-1 text-xs text-red-500">请输入正确的手机号</p>
            )}
        </div>
    );
}

export default Control;

