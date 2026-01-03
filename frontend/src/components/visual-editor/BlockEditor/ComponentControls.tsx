/**
 * ComponentControls - 组件控件渲染器
 * 
 * 根据组件定义渲染对应的输入控件
 * 用于在 DataBlockEditor 中替代普通输入框
 */

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronDown,
    Check,
    Star,
    X,
    Calendar,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    DocumentComponentDefinition,
    SelectComponentDefinition,
    RatingComponentDefinition,
    NumberComponentDefinition,
    DateComponentDefinition,
    TextComponentDefinition,
    TextareaComponentDefinition,
    ComponentOption,
} from '../ComponentPanel/types';

// ============================================================
// 通用 Props
// ============================================================

interface BaseControlProps<T> {
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}

// ============================================================
// 下拉选择控件
// ============================================================

interface SelectControlProps extends BaseControlProps<string> {
    options: ComponentOption[];
    placeholder?: string;
    multiple?: boolean;
}

function SelectControl({
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

// ============================================================
// 多选下拉控件
// ============================================================

interface MultiSelectControlProps extends BaseControlProps<string[]> {
    options: ComponentOption[];
    placeholder?: string;
    maxSelect?: number;
}

function MultiSelectControl({
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

// ============================================================
// 单选框组控件
// ============================================================

interface RadioControlProps extends BaseControlProps<string> {
    options: ComponentOption[];
}

function RadioControl({ value, onChange, options, disabled = false }: RadioControlProps) {
    return (
        <div className="flex flex-wrap gap-3">
            {options.map((option) => (
                <label
                    key={option.value}
                    className={cn(
                        'flex items-center gap-1.5 cursor-pointer',
                        disabled && 'cursor-not-allowed opacity-50'
                    )}
                >
                    <input
                        type="radio"
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        disabled={disabled}
                        className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-700">{option.value}</span>
                </label>
            ))}
        </div>
    );
}

// ============================================================
// 多选框组控件
// ============================================================

interface CheckboxControlProps extends BaseControlProps<string[]> {
    options: ComponentOption[];
    maxSelect?: number;
}

function CheckboxControl({
    value = [],
    onChange,
    options,
    maxSelect,
    disabled = false,
}: CheckboxControlProps) {
    const handleToggle = (key: string) => {
        if (value.includes(key)) {
            onChange(value.filter((v) => v !== key));
        } else {
            if (maxSelect && value.length >= maxSelect) return;
            onChange([...value, key]);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            {options.map((option) => {
                const isSelected = value.includes(option.value);
                const isDisabled = disabled || (!isSelected && maxSelect !== undefined && value.length >= maxSelect);
                return (
                    <label
                        key={option.value}
                        className={cn(
                            'flex items-center gap-1.5 cursor-pointer',
                            isDisabled && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(option.value)}
                            disabled={isDisabled}
                            className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700">{option.value}</span>
                    </label>
                );
            })}
        </div>
    );
}

// ============================================================
// 星级评分控件
// ============================================================

interface RatingControlProps extends BaseControlProps<number> {
    max?: number;
    allowHalf?: boolean;
}

function RatingControl({
    value = 0,
    onChange,
    max = 5,
    allowHalf = false,
    disabled = false,
}: RatingControlProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue !== null ? hoverValue : value;

    const handleClick = (rating: number) => {
        if (disabled) return;
        onChange(rating === value ? 0 : rating);
    };

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => {
                const starValue = i + 1;
                const isFilled = displayValue >= starValue;
                const isHalfFilled = allowHalf && displayValue === starValue - 0.5;

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleClick(starValue)}
                        onMouseEnter={() => !disabled && setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(null)}
                        disabled={disabled}
                        className={cn(
                            'p-0.5 transition-colors',
                            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                        )}
                    >
                        <Star
                            size={18}
                            className={cn(
                                'transition-colors',
                                isFilled || isHalfFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            )}
                        />
                    </button>
                );
            })}
            {value > 0 && (
                <button
                    type="button"
                    onClick={() => onChange(0)}
                    disabled={disabled}
                    className="ml-1 p-0.5 text-slate-300 hover:text-slate-500"
                    title="清除评分"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

// ============================================================
// 数字输入控件
// ============================================================

interface NumberControlProps extends BaseControlProps<number | ''> {
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

function NumberControl({
    value,
    onChange,
    min,
    max,
    step = 1,
    unit,
    disabled = false,
}: NumberControlProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange('');
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                onChange(num);
            }
        }
    };

    return (
        <div className="flex items-center gap-1 w-full">
            <input
                type="number"
                value={value === '' ? '' : value}
                onChange={handleChange}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={cn(
                    'flex-1 px-2 py-1 text-sm border border-slate-200 rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400',
                    disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
                )}
            />
            {unit && <span className="text-sm text-slate-500 flex-shrink-0">{unit}</span>}
        </div>
    );
}

// ============================================================
// 日期选择控件
// ============================================================

interface DateControlProps extends BaseControlProps<string> {
    format?: string;
    includeTime?: boolean;
}

function DateControl({
    value,
    onChange,
    includeTime = false,
    disabled = false,
}: DateControlProps) {
    return (
        <div className="relative w-full">
            <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
                type={includeTime ? 'datetime-local' : 'date'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    'w-full pl-7 pr-2 py-1 text-sm border border-slate-200 rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400',
                    disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
                )}
            />
        </div>
    );
}

// ============================================================
// 主组件 - 根据类型渲染对应控件
// ============================================================

// ============================================================
// 失效态降级控件 (Iron Rule 3)
// ============================================================

interface FallbackControlProps {
    /** 组件 ID（用于显示） */
    componentId: string;
    /** 当前值 */
    value: unknown;
    /** 值变化回调 */
    onChange: (value: unknown) => void;
}

/**
 * 组件不可用时的降级渲染
 * 
 * 根据 Iron Rule 3：任何插件组件在插件不存在时必须仍能渲染。
 * 显示警告信息、原始数据和手动输入框。
 */
export function FallbackControl({
    componentId,
    value,
    onChange,
}: FallbackControlProps) {
    const displayValue = typeof value === 'object' 
        ? JSON.stringify(value, null, 2) 
        : String(value ?? '');

    return (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertTriangle size={16} />
                <span className="font-medium text-sm">组件不可用</span>
            </div>
            <div className="text-xs text-amber-600 mb-2">
                组件 ID: <code className="bg-amber-100 px-1 rounded">{componentId}</code>
            </div>
            {typeof value === 'object' && value !== null && (
                <div className="text-xs bg-white p-2 rounded border border-amber-200 font-mono overflow-auto max-h-24 mb-2">
                    {displayValue}
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={typeof value === 'object' ? '' : String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        'flex-1 text-xs px-2 py-1 border border-amber-200 rounded',
                        'focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400',
                        'placeholder:text-amber-400'
                    )}
                    placeholder="手动输入值..."
                />
            </div>
            <p className="text-[10px] text-amber-500 mt-2">
                该字段绑定的组件未找到，可能已被删除或来自未导入的模板。
            </p>
        </div>
    );
}

// ============================================================
// 组件控件主入口
// ============================================================

export interface ComponentControlProps {
    /** 组件定义 */
    component: DocumentComponentDefinition;
    /** 当前值 */
    value: unknown;
    /** 值变化回调 */
    onChange: (value: unknown) => void;
    /** 是否禁用 */
    disabled?: boolean;
}

export function ComponentControl({
    component,
    value,
    onChange,
    disabled = false,
}: ComponentControlProps) {
    switch (component.type) {
        case 'select': {
            const selectDef = component as SelectComponentDefinition;
            return (
                <SelectControl
                    value={String(value || '')}
                    onChange={onChange}
                    options={selectDef.options}
                    placeholder={selectDef.placeholder}
                    disabled={disabled}
                />
            );
        }

        case 'multi-select': {
            const multiSelectDef = component as SelectComponentDefinition;
            const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
            return (
                <MultiSelectControl
                    value={arrayValue.map(String)}
                    onChange={onChange}
                    options={multiSelectDef.options}
                    placeholder={multiSelectDef.placeholder}
                    maxSelect={multiSelectDef.maxSelect}
                    disabled={disabled}
                />
            );
        }

        case 'radio': {
            const radioDef = component as SelectComponentDefinition;
            return (
                <RadioControl
                    value={String(value || '')}
                    onChange={onChange}
                    options={radioDef.options}
                    disabled={disabled}
                />
            );
        }

        case 'checkbox': {
            const checkboxDef = component as SelectComponentDefinition;
            const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
            return (
                <CheckboxControl
                    value={arrayValue.map(String)}
                    onChange={onChange}
                    options={checkboxDef.options}
                    maxSelect={checkboxDef.maxSelect}
                    disabled={disabled}
                />
            );
        }

        case 'rating': {
            const ratingDef = component as RatingComponentDefinition;
            return (
                <RatingControl
                    value={typeof value === 'number' ? value : 0}
                    onChange={onChange}
                    max={ratingDef.max}
                    allowHalf={ratingDef.allowHalf}
                    disabled={disabled}
                />
            );
        }

        case 'number': {
            const numberDef = component as NumberComponentDefinition;
            return (
                <NumberControl
                    value={typeof value === 'number' ? value : ''}
                    onChange={onChange}
                    min={numberDef.min}
                    max={numberDef.max}
                    step={numberDef.step}
                    unit={numberDef.unit}
                    disabled={disabled}
                />
            );
        }

        case 'date': {
            const dateDef = component as DateComponentDefinition;
            return (
                <DateControl
                    value={String(value || '')}
                    onChange={onChange}
                    includeTime={dateDef.includeTime}
                    disabled={disabled}
                />
            );
        }

        case 'text': {
            const textDef = component as TextComponentDefinition;
            return (
                <input
                    type="text"
                    value={String(value || '')}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={textDef.placeholder}
                    maxLength={textDef.maxLength}
                    disabled={disabled}
                    className={cn(
                        'w-full px-2 py-1 text-sm border border-slate-200 rounded-md',
                        'focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400',
                        disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
                    )}
                />
            );
        }

        case 'textarea': {
            const textareaDef = component as TextareaComponentDefinition;
            return (
                <textarea
                    value={String(value || '')}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={textareaDef.placeholder}
                    rows={textareaDef.rows || 3}
                    maxLength={textareaDef.maxLength}
                    disabled={disabled}
                    className={cn(
                        'w-full px-2 py-1 text-sm border border-slate-200 rounded-md resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400',
                        disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
                    )}
                />
            );
        }

        default:
            return (
                <input
                    type="text"
                    value={String(value || '')}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded-md"
                />
            );
    }
}

export default ComponentControl;

