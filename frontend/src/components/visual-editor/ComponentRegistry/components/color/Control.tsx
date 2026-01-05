/**
 * Color 组件 - 数据块控件
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Palette, Pipette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, ColorComponentDefinition } from '../../types';
import { DEFAULT_PRESETS } from './config';

/** 验证颜色格式 */
export function isValidColor(color: string): boolean {
    if (!color) return false;
    
    // HEX 格式
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
        return true;
    }
    
    // RGB/RGBA 格式
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i.test(color)) {
        return true;
    }
    
    // HSL/HSLA 格式
    if (/^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*(,\s*[\d.]+)?\s*\)$/i.test(color)) {
        return true;
    }
    
    return false;
}

/** HEX 转 RGB */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
}

/** RGB 转 HEX */
export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const colorDef = component as ColorComponentDefinition;
    const [showPicker, setShowPicker] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);
    
    const stringValue = typeof value === 'string' ? value : '';
    const presets = colorDef.presets || DEFAULT_PRESETS;

    // 同步输入值
    useEffect(() => {
        setInputValue(stringValue);
    }, [stringValue]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 处理颜色选择
    const handleColorSelect = (color: string) => {
        onChange(color);
        setInputValue(color);
    };

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        
        if (isValidColor(newValue) || newValue === '') {
            onChange(newValue || null);
        }
    };

    // 处理原生颜色选择器
    const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        onChange(color);
        setInputValue(color);
    };

    // 计算对比色（用于勾选标记）
    const getContrastColor = (color: string): string => {
        const rgb = hexToRgb(color);
        if (!rgb) return '#000000';
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    };

    return (
        <div className="relative" ref={pickerRef}>
            <div className="flex items-center gap-2">
                {/* 颜色预览 */}
                <button
                    type="button"
                    onClick={() => !disabled && setShowPicker(!showPicker)}
                    disabled={disabled}
                    className={cn(
                        'w-10 h-10 rounded-lg border-2 border-slate-200 flex items-center justify-center',
                        'hover:border-purple-300 transition-colors',
                        disabled && 'cursor-not-allowed opacity-50'
                    )}
                    style={{ backgroundColor: stringValue || '#ffffff' }}
                >
                    {!stringValue && <Palette className="h-4 w-4 text-slate-400" />}
                </button>

                {/* 颜色输入框 */}
                {colorDef.showInput !== false && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={disabled}
                        placeholder="#000000"
                        className={cn(
                            'flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono',
                            'focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400',
                            !isValidColor(inputValue) && inputValue && 'border-red-300',
                            disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        )}
                    />
                )}

                {/* 原生颜色选择器 */}
                <label className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200',
                    'hover:bg-slate-50 cursor-pointer transition-colors',
                    disabled && 'cursor-not-allowed opacity-50'
                )}>
                    <Pipette className="h-4 w-4 text-slate-500" />
                    <input
                        type="color"
                        value={stringValue || '#000000'}
                        onChange={handleNativeColorChange}
                        disabled={disabled}
                        className="sr-only"
                    />
                </label>
            </div>

            {/* 预设颜色面板 */}
            {showPicker && !disabled && (
                <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg shadow-lg border border-slate-200 w-64">
                    <div className="text-xs text-slate-500 mb-2">预设颜色</div>
                    <div className="grid grid-cols-10 gap-1">
                        {presets.map((color, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleColorSelect(color)}
                                className={cn(
                                    'w-5 h-5 rounded border border-slate-200 hover:scale-110 transition-transform',
                                    'flex items-center justify-center'
                                )}
                                style={{ backgroundColor: color }}
                                title={color}
                            >
                                {stringValue === color && (
                                    <Check 
                                        className="h-3 w-3" 
                                        style={{ color: getContrastColor(color) }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Control;

