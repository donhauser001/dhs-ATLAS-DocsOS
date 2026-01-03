/**
 * Textarea 组件 - 数据块控件
 */

import { cn } from '@/lib/utils';
import { ControlProps, TextareaComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const textareaDef = component as TextareaComponentDefinition;

    return (
        <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            rows={textareaDef.rows || 3}
            maxLength={textareaDef.maxLength}
            placeholder={textareaDef.placeholder || '请输入...'}
            className={cn(
                'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-y',
                'focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400',
                disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
            )}
        />
    );
}

export default Control;

