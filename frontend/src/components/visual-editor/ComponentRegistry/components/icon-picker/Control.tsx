/**
 * IconPicker 组件 - 数据块控件
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, IconPickerComponentDefinition } from '../../types';

// 常用图标列表
export const COMMON_ICONS = [
    'Home', 'User', 'Settings', 'Mail', 'Phone', 'Calendar', 'Clock', 'Star',
    'Heart', 'Bell', 'Search', 'File', 'Folder', 'Image', 'Camera', 'Video',
    'Music', 'Download', 'Upload', 'Share', 'Link', 'Lock', 'Unlock', 'Key',
    'Edit', 'Trash', 'Plus', 'Minus', 'Check', 'X', 'AlertCircle', 'Info',
    'HelpCircle', 'MessageCircle', 'Send', 'Globe', 'Map', 'Navigation',
    'Bookmark', 'Tag', 'Hash', 'AtSign', 'DollarSign', 'CreditCard', 'ShoppingCart',
    'Package', 'Gift', 'Award', 'Zap', 'Sun', 'Moon', 'Cloud', 'Umbrella',
];

// 获取所有可用的图标名称
export function getIconNames(): string[] {
    return Object.keys(LucideIcons).filter(
        name => typeof (LucideIcons as Record<string, unknown>)[name] === 'function' &&
        name !== 'createLucideIcon' &&
        !name.startsWith('Lucide')
    );
}

// 渲染图标
export function renderIcon(name: string, className?: string): React.ReactNode {
    const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const iconDef = component as IconPickerComponentDefinition;
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    const stringValue = typeof value === 'string' ? value : '';

    // 获取过滤后的图标列表
    const filteredIcons = useMemo(() => {
        const allIcons = searchQuery ? getIconNames() : COMMON_ICONS;
        if (!searchQuery) return allIcons;
        
        const query = searchQuery.toLowerCase();
        return allIcons.filter(name => name.toLowerCase().includes(query)).slice(0, 60);
    }, [searchQuery]);

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

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        setShowPicker(false);
        setSearchQuery('');
    };

    const handleClear = () => {
        onChange(null);
    };

    return (
        <div className="relative" ref={pickerRef}>
            <div className="flex items-center gap-2">
                {/* 图标预览 */}
                <button
                    type="button"
                    onClick={() => !disabled && setShowPicker(!showPicker)}
                    disabled={disabled}
                    className={cn(
                        'w-10 h-10 rounded-lg border-2 border-slate-200 flex items-center justify-center',
                        'hover:border-purple-300 transition-colors',
                        disabled && 'cursor-not-allowed opacity-50',
                        stringValue && 'border-purple-200 bg-purple-50'
                    )}
                >
                    {stringValue ? (
                        renderIcon(stringValue, 'h-5 w-5 text-purple-600')
                    ) : (
                        <Search className="h-4 w-4 text-slate-400" />
                    )}
                </button>

                {/* 图标名称显示 */}
                {iconDef.showLabel && stringValue && (
                    <span className="text-sm text-slate-600">{stringValue}</span>
                )}

                {/* 清除按钮 */}
                {stringValue && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* 图标选择面板 */}
            {showPicker && !disabled && (
                <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg shadow-lg border border-slate-200 w-80">
                    {/* 搜索框 */}
                    {iconDef.searchable !== false && (
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索图标..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* 图标网格 */}
                    <div className="max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-8 gap-1">
                            {filteredIcons.map((iconName) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => handleSelect(iconName)}
                                    className={cn(
                                        'w-8 h-8 flex items-center justify-center rounded hover:bg-purple-50',
                                        'transition-colors',
                                        stringValue === iconName && 'bg-purple-100 ring-2 ring-purple-300'
                                    )}
                                    title={iconName}
                                >
                                    {renderIcon(iconName, 'h-4 w-4 text-slate-600')}
                                </button>
                            ))}
                        </div>
                        {filteredIcons.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">
                                未找到匹配的图标
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Control;

