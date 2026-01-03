/**
 * DocTypeSelector - 文档类型选择器
 * 
 * 用于在文档属性面板中选择文档类型
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
} from "@/components/ui/select";
import * as LucideIcons from 'lucide-react';
import { fetchDocTypeConfig, type DocTypeConfig, type DocTypeItem } from '@/api/doc-types';

interface DocTypeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    /** 紧凑模式（用于属性面板） */
    compact?: boolean;
}

export function DocTypeSelector({
    value,
    onChange,
    disabled = false,
    className,
    placeholder = "选择文档类型",
    compact = false,
}: DocTypeSelectorProps) {
    const [config, setConfig] = useState<DocTypeConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocTypeConfig()
            .then(setConfig)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // 找到当前选中的项
    const selectedItem = useMemo(() => {
        if (!config || !value) return null;
        for (const group of config.groups) {
            const item = group.items.find(i => i.id === value);
            if (item) return item;
        }
        return null;
    }, [config, value]);

    // 获取图标组件
    const getIcon = (iconName?: string) => {
        if (!iconName) return null;
        const pascalCase = iconName
            .split('-')
            .map(p => p.charAt(0).toUpperCase() + p.slice(1))
            .join('');
        return (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase];
    };

    const SelectedIcon = selectedItem?.icon ? getIcon(selectedItem.icon) : null;

    // 过滤掉空分组
    const filteredGroups = config?.groups.filter(g => g.items.length > 0) || [];

    const handleChange = (val: string) => {
        onChange(val === '__none__' ? '' : val);
    };

    if (loading) {
        return (
            <div className={`h-8 bg-slate-100 rounded animate-pulse ${className}`} />
        );
    }

    return (
        <Select value={value || '__none__'} onValueChange={handleChange} disabled={disabled}>
            <SelectTrigger className={`${compact ? 'h-7 text-xs border-0 bg-transparent hover:bg-slate-50 px-1' : ''} ${className}`}>
                <SelectValue placeholder={placeholder}>
                    {selectedItem && (
                        <div className="flex items-center gap-1.5">
                            {SelectedIcon && <SelectedIcon className="h-3.5 w-3.5 text-slate-500" />}
                            <span className={compact ? 'text-xs' : ''}>{selectedItem.label}</span>
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {/* 清除选项 */}
                <SelectItem value="__none__">
                    <span className="text-slate-400">未设置</span>
                </SelectItem>

                {filteredGroups.map((group) => (
                    <SelectGroup key={group.id}>
                        <SelectLabel className="text-xs text-slate-400">{group.label}</SelectLabel>
                        {group.items.map((item) => {
                            const ItemIcon = item.icon ? getIcon(item.icon) : null;
                            return (
                                <SelectItem key={item.id} value={item.id}>
                                    <div className="flex items-center gap-2">
                                        {ItemIcon && <ItemIcon className="h-3.5 w-3.5 text-slate-500" />}
                                        <span>{item.label}</span>
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

export default DocTypeSelector;

