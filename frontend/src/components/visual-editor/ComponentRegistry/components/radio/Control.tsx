/**
 * Radio 组件 - 数据块控件
 */

import { cn } from '@/lib/utils';
import { ControlProps, SelectComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const selectDef = component as SelectComponentDefinition;
    const options = selectDef.options || [];

    return (
        <div className="space-y-2">
            {options.map((opt, idx) => (
                <label
                    key={idx}
                    className={cn(
                        'flex items-center gap-2 cursor-pointer',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input
                        type="radio"
                        name={component.id}
                        checked={value === opt.value}
                        onChange={() => onChange(opt.value)}
                        disabled={disabled}
                        className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-700">{opt.value}</span>
                </label>
            ))}
        </div>
    );
}

export default Control;

