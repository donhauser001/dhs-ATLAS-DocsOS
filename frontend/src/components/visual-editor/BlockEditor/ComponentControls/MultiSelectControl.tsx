/**
 * MultiSelectControl - 多选下拉控件
 */

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentOption } from '../../ComponentPanel/types';
import type { BaseControlProps } from './types';

interface MultiSelectControlProps extends BaseControlProps<string[]> {
    options: ComponentOption[];
    placeholder?: string;
    maxSelect?: number;
}

export function MultiSelectControl({
    value = [],
    onChange,
    options,
    placeholder = '选择...',
    maxSelect,
    disabled = false,
}: MultiSelectControlProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });

    const handleOpen = useCallback(() => {
        if (disabled) return;
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPopupPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 160),
            });
        }
        setIsOpen(true);
    }, [disabled]);

    const handleToggle = useCallback(
        (key: string) => {
            if (value.includes(key)) {
                onChange(value.filter((v) => v !== key));
            } else {
                if (maxSelect && value.length >= maxSelect) return;
                onChange([...value, key]);
            }
        },
        [value, onChange, maxSelect]
    );

    const selectedValues = options.filter((o) => value.includes(o.value)).map((o) => o.value);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={cn(
                    'w-full flex items-center justify-between gap-2 px-2 py-1 text-sm rounded-md border transition-colors',
                    'hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/30',
                    isOpen ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <span className={cn('flex-1 text-left truncate', selectedValues.length > 0 ? 'text-slate-700' : 'text-slate-400')}>
                    {selectedValues.length > 0 ? selectedValues.join(', ') : placeholder}
                </span>
                <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
            </button>

            {isOpen &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                        <div
                            className="fixed z-[101] bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-[200px] overflow-auto"
                            style={{
                                top: popupPosition.top,
                                left: popupPosition.left,
                                minWidth: popupPosition.width,
                            }}
                        >
                            {options.map((option) => {
                                const isSelected = value.includes(option.value);
                                const isDisabled = !isSelected && maxSelect !== undefined && value.length >= maxSelect;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleToggle(option.value)}
                                        disabled={isDisabled}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors',
                                            isSelected ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50',
                                            isDisabled && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                                                isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-300'
                                            )}
                                        >
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span>{option.value}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}

export default MultiSelectControl;

