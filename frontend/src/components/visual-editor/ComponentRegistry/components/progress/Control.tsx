/**
 * Progress 组件 - 数据块控件
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ControlProps, ProgressComponentDefinition } from '../../types';

/** 解析进度值（0-100） */
export function parseProgress(value: unknown): number {
    if (typeof value === 'number') {
        return Math.max(0, Math.min(100, value));
    }
    if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            return Math.max(0, Math.min(100, num));
        }
    }
    return 0;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const progressDef = component as ProgressComponentDefinition;
    
    const progress = useMemo(() => parseProgress(value), [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onChange(newValue);
    };

    const barColor = progressDef.color || '#8b5cf6';
    const trackColor = progressDef.trackColor || '#e2e8f0';
    const height = progressDef.height || 8;

    return (
        <div className="space-y-2">
            {/* 进度条 */}
            <div className="flex items-center gap-3">
                <div 
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: trackColor, height }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                            width: `${progress}%`,
                            backgroundColor: barColor,
                        }}
                    />
                </div>
                
                {/* 百分比显示 */}
                {progressDef.showLabel !== false && (
                    <span className="text-sm font-medium text-slate-600 min-w-[3rem] text-right">
                        {Math.round(progress)}%
                    </span>
                )}
            </div>

            {/* 可编辑滑块 */}
            {progressDef.editable && !disabled && (
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={progress}
                    onChange={handleChange}
                    disabled={disabled}
                    className={cn(
                        'w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer',
                        'accent-purple-500',
                        disabled && 'cursor-not-allowed opacity-50'
                    )}
                />
            )}
        </div>
    );
}

export default Control;


