/**
 * Select 组件 - 数据块控件
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, SelectComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const selectDef = component as SelectComponentDefinition;
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const options = selectDef.options || [];
    const selectedOption = options.find(opt => opt.value === value);

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
            const target = e.target as Node;
            // 检查点击是否在触发器或下拉菜单内部
            if (triggerRef.current?.contains(target)) return;
            if (dropdownRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        // 使用 mousedown 而不是 click，延迟添加监听器避免立即触发
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optValue: string) => {
        onChange(optValue);
        setIsOpen(false);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-colors text-left',
                    disabled
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'bg-white hover:border-slate-300',
                    isOpen ? 'border-purple-400 ring-2 ring-purple-400/20' : 'border-slate-200'
                )}
            >
                <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedOption?.value || '请选择...'}
                </span>
                <ChevronDown size={16} className={cn(
                    'text-slate-400 transition-transform',
                    isOpen && 'rotate-180'
                )} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto"
                >
                    {options.map((opt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={cn(
                                'w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-50',
                                opt.value === value && 'bg-purple-50 text-purple-700'
                            )}
                        >
                            <span>{opt.value}</span>
                            {opt.value === value && <Check size={14} className="text-purple-600" />}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}

export default Control;

