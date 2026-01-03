/**
 * Rating 组件 - 数据块控件
 */

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, RatingComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const ratingDef = component as RatingComponentDefinition;
    const max = ratingDef.max || 5;
    const allowHalf = ratingDef.allowHalf || false;
    const currentValue = typeof value === 'number' ? value : 0;
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue !== null ? hoverValue : currentValue;

    const handleClick = (starIndex: number, isHalf: boolean) => {
        if (disabled) return;
        const newValue = isHalf ? starIndex - 0.5 : starIndex;
        onChange(newValue === currentValue ? null : newValue);
    };

    const handleMouseMove = (starIndex: number, e: React.MouseEvent) => {
        if (disabled || !allowHalf) {
            setHoverValue(starIndex);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const isHalf = e.clientX - rect.left < rect.width / 2;
        setHoverValue(isHalf ? starIndex - 0.5 : starIndex);
    };

    return (
        <div
            className={cn('flex items-center gap-1', disabled && 'opacity-50')}
            onMouseLeave={() => setHoverValue(null)}
        >
            {Array.from({ length: max }, (_, i) => {
                const starIndex = i + 1;
                const isFilled = displayValue >= starIndex;
                const isHalfFilled = !isFilled && displayValue >= starIndex - 0.5;

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const isHalf = allowHalf && e.clientX - rect.left < rect.width / 2;
                            handleClick(starIndex, isHalf);
                        }}
                        onMouseMove={(e) => handleMouseMove(starIndex, e)}
                        className={cn(
                            'relative p-0.5 transition-colors',
                            !disabled && 'cursor-pointer hover:scale-110'
                        )}
                    >
                        <Star
                            size={20}
                            className={cn(
                                'transition-colors',
                                isFilled
                                    ? 'fill-amber-400 text-amber-400'
                                    : isHalfFilled
                                        ? 'text-amber-400'
                                        : 'text-slate-300'
                            )}
                            style={isHalfFilled ? {
                                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
                                fill: '#fbbf24',
                            } : undefined}
                        />
                        {isHalfFilled && (
                            <Star
                                size={20}
                                className="absolute top-0.5 left-0.5 text-slate-300"
                                style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                            />
                        )}
                    </button>
                );
            })}
            <span className="ml-2 text-sm text-slate-500">
                {currentValue > 0 ? currentValue : '-'} / {max}
            </span>
        </div>
    );
}

export default Control;

