/**
 * Toggle 组件 - 数据块控件
 */

import { cn } from '@/lib/utils';
import { ControlProps, ToggleComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const toggleDef = component as ToggleComponentDefinition;
    
    // 将值转换为布尔值
    const isOn = value === true || value === 'true' || value === 1 || value === '1';

    const handleToggle = () => {
        if (disabled) return;
        onChange(isOn ? 'false' : 'true');
    };

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                role="switch"
                aria-checked={isOn}
                onClick={handleToggle}
                disabled={disabled}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                    'transition-colors duration-200 ease-in-out',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2',
                    isOn ? 'bg-purple-500' : 'bg-slate-200',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <span
                    className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg',
                        'transform ring-0 transition duration-200 ease-in-out',
                        isOn ? 'translate-x-5' : 'translate-x-0'
                    )}
                />
            </button>
            <span className={cn(
                'text-sm',
                isOn ? 'text-purple-600 font-medium' : 'text-slate-500'
            )}>
                {isOn ? (toggleDef.onLabel || '开启') : (toggleDef.offLabel || '关闭')}
            </span>
        </div>
    );
}

export default Control;

