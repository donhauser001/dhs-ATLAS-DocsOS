/**
 * SelectControl - 下拉选择控件
 */

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentOption } from '../../ComponentPanel/types';
import type { BaseControlProps } from './types';

interface SelectControlProps extends BaseControlProps<string> {
    options: ComponentOption[];
    placeholder?: string;
}

export function SelectControl({
    value,
    onChange,
    options,
    placeholder = '选择...',
    disabled = false,
}: SelectControlProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });

    const selectedOption = options.find((o) => o.value === value);

    const handleOpen = useCallback(() => {
        if (disabled) return;
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPopupPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
        setIsOpen(true);
    }, [disabled]);

    const handleSelect = useCallback(
        (optionValue: string) => {
            onChange(optionValue);
            setIsOpen(false);
        },
        [onChange]
    );

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
                <span className={cn('flex-1 text-left truncate', selectedOption ? 'text-slate-700' : 'text-slate-400')}>
                    {selectedOption?.value || placeholder}
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
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-purple-50 transition-colors',
                                        option.value === value && 'bg-purple-50 text-purple-700'
                                    )}
                                >
                                    {option.value === value && <Check size={14} className="text-purple-600" />}
                                    <span className={option.value !== value ? 'ml-[22px]' : ''}>{option.value}</span>
                                </button>
                            ))}
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}

export default SelectControl;

