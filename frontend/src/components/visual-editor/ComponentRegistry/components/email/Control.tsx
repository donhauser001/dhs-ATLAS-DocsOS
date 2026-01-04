/**
 * Email 组件 - 数据块控件
 */

import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, EmailComponentDefinition } from '../../types';

// 验证邮箱
function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const emailDef = component as EmailComponentDefinition;
    const stringValue = typeof value === 'string' ? value : '';
    const isValid = !stringValue || isValidEmail(stringValue);

    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="h-4 w-4" />
            </div>
            <input
                type="email"
                value={stringValue}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled}
                placeholder={emailDef.placeholder || '请输入邮箱地址'}
                className={cn(
                    'w-full pl-10 pr-3 py-2 text-sm border rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                    !isValid && stringValue && 'border-red-300 focus:ring-red-400/50',
                    isValid && 'border-slate-200 focus:border-purple-400',
                    disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                )}
            />
            {!isValid && stringValue && (
                <p className="mt-1 text-xs text-red-500">请输入正确的邮箱地址</p>
            )}
        </div>
    );
}

export default Control;

