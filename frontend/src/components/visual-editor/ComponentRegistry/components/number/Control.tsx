/**
 * Number 组件 - 数据块控件
 */

import { cn } from '@/lib/utils';
import { ControlProps, NumberComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const numberDef = component as NumberComponentDefinition;
    const currentValue = typeof value === 'number' ? value : (value ? Number(value) : '');

    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                value={currentValue}
                onChange={(e) => {
                    const val = e.target.value;
                    onChange(val ? parseFloat(val) : null);
                }}
                disabled={disabled}
                min={numberDef.min}
                max={numberDef.max}
                step={numberDef.step || 1}
                className={cn(
                    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400',
                    disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                )}
                placeholder="输入数字..."
            />
            {numberDef.unit && (
                <span className="text-sm text-slate-500 flex-shrink-0">{numberDef.unit}</span>
            )}
        </div>
    );
}

export default Control;

