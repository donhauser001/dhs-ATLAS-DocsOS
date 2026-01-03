/**
 * MultiSelect 组件 - 数据块控件
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, SelectComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const selectDef = component as SelectComponentDefinition;
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const options = selectDef.options || [];
    const selectedValues: string[] = Array.isArray(value) ? value : (value ? [String(value)] : []);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleOption = (optValue: string) => {
        const newValues = selectedValues.includes(optValue)
            ? selectedValues.filter(v => v !== optValue)
            : [...selectedValues, optValue];
        onChange(newValues.length > 0 ? newValues : null);
    };

    const removeValue = (optValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newValues = selectedValues.filter(v => v !== optValue);
        onChange(newValues.length > 0 ? newValues : null);
    };

    return (
        <>
            <div
                ref={triggerRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    'w-full min-h-[38px] flex items-center flex-wrap gap-1 px-2 py-1 text-sm border rounded-lg cursor-pointer transition-colors',
                    disabled
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'bg-white hover:border-slate-300',
                    isOpen ? 'border-purple-400 ring-2 ring-purple-400/20' : 'border-slate-200'
                )}
            >
                {selectedValues.length > 0 ? (
                    selectedValues.map((val, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                            {val}
                            {!disabled && (
                                <X
                                    size={12}
                                    className="cursor-pointer hover:text-purple-900"
                                    onClick={(e) => removeValue(val, e)}
                                />
                            )}
                        </span>
                    ))
                ) : (
                    <span className="text-slate-400 py-0.5">请选择...</span>
                )}
                <ChevronDown size={16} className={cn(
                    'ml-auto text-slate-400 transition-transform flex-shrink-0',
                    isOpen && 'rotate-180'
                )} />
            </div>

            {isOpen && createPortal(
                <div
                    style={dropdownStyle}
                    className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto"
                >
                    {options.map((opt, idx) => {
                        const isSelected = selectedValues.includes(opt.value);
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => toggleOption(opt.value)}
                                className={cn(
                                    'w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-50',
                                    isSelected && 'bg-purple-50'
                                )}
                            >
                                <span className={isSelected ? 'text-purple-700' : ''}>{opt.value}</span>
                                {isSelected && <Check size={14} className="text-purple-600" />}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
}

export default Control;

