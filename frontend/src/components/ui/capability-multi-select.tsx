/**
 * CapabilityMultiSelect - 能力类型多选组件
 * 
 * 用于在文档属性面板中多选能力类型
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { fetchCapabilityConfig, type CapabilityConfig } from '@/api/capabilities';

interface CapabilityMultiSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

function getIcon(iconName?: string): React.ComponentType<{ className?: string }> | null {
    if (!iconName) return null;
    const pascalCase = iconName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase] || null;
}

export function CapabilityMultiSelect({
    value = [],
    onChange,
    disabled = false,
    className,
    placeholder = "添加能力...",
}: CapabilityMultiSelectProps) {
    const [config, setConfig] = useState<CapabilityConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchCapabilityConfig()
            .then(setConfig)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // 获取选中项的详情
    const selectedItems = useMemo(() => {
        if (!config) return [];
        const items: { id: string; label: string; icon?: string }[] = [];
        for (const id of value) {
            for (const group of config.groups) {
                const item = group.items.find(i => i.id === id);
                if (item) {
                    items.push({ id: item.id, label: item.label, icon: item.icon });
                    break;
                }
            }
        }
        return items;
    }, [config, value]);

    // 移除能力
    const handleRemove = (id: string) => {
        onChange(value.filter(v => v !== id));
    };

    // 添加能力
    const handleAdd = (id: string) => {
        if (!value.includes(id)) {
            onChange([...value, id]);
        }
    };

    // 可选的能力（排除已选择的）
    const availableGroups = useMemo(() => {
        if (!config) return [];
        return config.groups
            .map(group => ({
                ...group,
                items: group.items.filter(item => !value.includes(item.id)),
            }))
            .filter(group => group.items.length > 0);
    }, [config, value]);

    if (loading) {
        return (
            <div className={cn("flex flex-wrap gap-1", className)}>
                <span className="text-xs text-slate-400">加载中...</span>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-wrap items-center gap-1", className)}>
            {/* 已选择的能力标签 */}
            {selectedItems.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                    <span
                        key={item.id}
                        className={cn(
                            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
                            'bg-amber-100 text-amber-700 border border-amber-200'
                        )}
                    >
                        {Icon ? <Icon className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                        <span>{item.label}</span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemove(item.id)}
                                className="hover:opacity-70 transition-opacity ml-0.5"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </span>
                );
            })}

            {/* 添加按钮 */}
            {!disabled && availableGroups.length > 0 && (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs
                                     text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <Plus className="w-2.5 h-2.5" />
                            <span>{selectedItems.length === 0 ? placeholder : '添加'}</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                        <ScrollArea className="h-64">
                            <div className="p-2">
                                {availableGroups.map((group) => (
                                    <div key={group.id} className="mb-3">
                                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 px-2">
                                            {group.label}
                                        </div>
                                        <div className="space-y-0.5">
                                            {group.items.map((item) => {
                                                const Icon = getIcon(item.icon);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => {
                                                            handleAdd(item.id);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded
                                                                 text-left text-sm hover:bg-slate-100 transition-colors"
                                                    >
                                                        {Icon ? (
                                                            <Icon className="w-3.5 h-3.5 text-slate-500" />
                                                        ) : (
                                                            <Zap className="w-3.5 h-3.5 text-slate-500" />
                                                        )}
                                                        <span>{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            )}

            {/* 空状态 */}
            {selectedItems.length === 0 && disabled && (
                <span className="text-xs text-slate-400">—</span>
            )}
        </div>
    );
}

export default CapabilityMultiSelect;

