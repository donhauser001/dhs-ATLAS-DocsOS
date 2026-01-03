/**
 * DisplayModeSelector - 显现模式选择器
 * 
 * 从已注册的显现模式中选择，按分类分组显示
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import * as LucideIcons from 'lucide-react';
import { fetchDisplayModeConfig, type DisplayModeConfig, type DisplayModeItem } from '@/api/display-modes';

// ============================================================
// 类型定义
// ============================================================

export interface DisplayModeSelectorProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** 可选：限制显示的模式（根据功能类型过滤） */
    allowedModes?: string[];
    /** 紧凑模式（用于属性面板） */
    compact?: boolean;
}

// ============================================================
// 图标获取工具
// ============================================================

function getIcon(iconName?: string): React.ComponentType<{ className?: string }> | null {
    if (!iconName) return null;
    const pascalCase = iconName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase] || null;
}

// ============================================================
// 主组件
// ============================================================

export function DisplayModeSelector({
    value,
    onChange,
    placeholder = '选择显现模式',
    disabled = false,
    className,
    allowedModes,
    compact = false,
}: DisplayModeSelectorProps) {
    const [config, setConfig] = useState<DisplayModeConfig | null>(null);
    const [loading, setLoading] = useState(true);

    // 加载显现模式配置
    useEffect(() => {
        fetchDisplayModeConfig()
            .then(setConfig)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // 过滤后的分组（如果指定了 allowedModes）
    const filteredGroups = useMemo(() => {
        if (!config) return [];
        if (!allowedModes || allowedModes.length === 0) return config.groups;

        return config.groups
            .map(group => ({
                ...group,
                items: group.items.filter(item => allowedModes.includes(item.id)),
            }))
            .filter(group => group.items.length > 0);
    }, [config, allowedModes]);

    // 查找当前选中项的信息
    const selectedItem = useMemo(() => {
        if (!config || !value) return null;
        for (const group of config.groups) {
            const item = group.items.find(i => i.id === value);
            if (item) return item;
        }
        return null;
    }, [config, value]);

    const SelectedIcon = selectedItem ? getIcon(selectedItem.icon) : null;

    if (loading) {
        return (
            <Select disabled>
                <SelectTrigger className={className}>
                    <SelectValue placeholder="加载中..." />
                </SelectTrigger>
            </Select>
        );
    }

    const handleChange = (val: string) => {
        onChange(val === '__none__' ? '' : val);
    };

    return (
        <Select value={value || '__none__'} onValueChange={handleChange} disabled={disabled}>
            <SelectTrigger className={`${compact ? 'h-7 text-xs border-0 bg-transparent hover:bg-slate-50 px-1' : ''} ${className || ''}`}>
                <SelectValue placeholder={placeholder}>
                    {selectedItem && (
                        <div className="flex items-center gap-1.5">
                            {SelectedIcon && <SelectedIcon className={compact ? "h-3.5 w-3.5 text-slate-500" : "h-4 w-4 text-slate-500"} />}
                            <span className={compact ? 'text-xs' : ''}>{selectedItem.label}</span>
                            {!compact && <code className="text-[10px] text-slate-400 ml-1">{selectedItem.id}</code>}
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {/* 清除选项 */}
                <SelectItem value="__none__">
                    <span className="text-slate-400">无</span>
                </SelectItem>
                
                {filteredGroups.map((group) => (
                    <SelectGroup key={group.id}>
                        <SelectLabel className="text-xs text-slate-500 font-medium">
                            {group.label}
                        </SelectLabel>
                        {group.items.map((item) => {
                            const Icon = getIcon(item.icon);
                            return (
                                <SelectItem key={item.id} value={item.id}>
                                    <div className="flex items-center gap-2">
                                        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                                        <span>{item.label}</span>
                                        <code className="text-[10px] text-slate-400 ml-1">{item.id}</code>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
    );
}

export default DisplayModeSelector;

