/**
 * Text 组件 - 数据块控件
 */

import { cn } from '@/lib/utils';
import { ControlProps, TextComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const textDef = component as TextComponentDefinition;

    return (
        <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            maxLength={textDef.maxLength}
            placeholder={textDef.placeholder || '请输入...'}
            className={cn(
                'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400',
                disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
            )}
        />
    );
}

export default Control;

