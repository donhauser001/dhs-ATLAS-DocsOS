/**
 * ViewSwitcher - 视图切换器组件
 * 
 * 根据文档配置的显现模式渲染可切换的视图按钮
 * 支持记住用户最后选择的视图（localStorage）
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchDisplayModeConfig, type DisplayModeConfig, type DisplayModeItem } from '@/api/display-modes';

export interface ViewSwitcherProps {
    /** 文档路径（用于存储偏好） */
    documentPath: string;
    /** 可用的显现模式 ID 数组 */
    availableModes: string[];
    /** 当前选中的模式 */
    activeMode?: string;
    /** 模式变化回调 */
    onModeChange?: (mode: string) => void;
    /** 是否紧凑模式 */
    compact?: boolean;
    /** 额外的样式类 */
    className?: string;
}

/**
 * 获取 Lucide 图标组件
 */
function getIcon(iconName?: string): React.ComponentType<{ className?: string; size?: number }> | null {
    if (!iconName) return null;
    const pascalCase = iconName
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    return (LucideIcons as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[pascalCase] || null;
}

/**
 * 获取 localStorage key
 */
function getStorageKey(documentPath: string): string {
    return `atlas-view-preference:${documentPath}`;
}

export function ViewSwitcher({
    documentPath,
    availableModes,
    activeMode: controlledActiveMode,
    onModeChange,
    compact = false,
    className,
}: ViewSwitcherProps) {
    const [config, setConfig] = useState<DisplayModeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [internalActiveMode, setInternalActiveMode] = useState<string>(() => {
        // 优先使用 localStorage 中保存的偏好
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(getStorageKey(documentPath));
            if (saved && availableModes.includes(saved)) {
                return saved;
            }
        }
        return availableModes[0] || '';
    });

    // 使用受控或非受控模式
    const activeMode = controlledActiveMode !== undefined ? controlledActiveMode : internalActiveMode;

    // 加载配置
    useEffect(() => {
        fetchDisplayModeConfig()
            .then(setConfig)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // 获取可用模式的详细信息
    const modeDetails = useMemo<DisplayModeItem[]>(() => {
        if (!config) return [];

        const details: DisplayModeItem[] = [];
        for (const modeId of availableModes) {
            for (const group of config.groups) {
                const item = group.items.find(i => i.id === modeId);
                if (item) {
                    details.push(item);
                    break;
                }
            }
        }
        return details;
    }, [config, availableModes]);

    // 处理模式切换
    const handleModeChange = useCallback((mode: string) => {
        // 保存到 localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(getStorageKey(documentPath), mode);
        }

        // 更新内部状态
        setInternalActiveMode(mode);

        // 通知外部
        onModeChange?.(mode);
    }, [documentPath, onModeChange]);

    // 只有一个模式时不显示切换器
    if (availableModes.length <= 1) {
        return null;
    }

    if (loading) {
        return (
            <div className={cn("flex items-center gap-1", className)}>
                <span className="text-xs text-slate-400">加载中...</span>
            </div>
        );
    }

    // 紧凑模式：只显示图标按钮
    if (compact) {
        return (
            <div className={cn("flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg", className)}>
                {modeDetails.map((mode) => {
                    const Icon = getIcon(mode.icon);
                    const isActive = activeMode === mode.id;

                    return (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => handleModeChange(mode.id)}
                            className={cn(
                                "p-1.5 rounded-md transition-all duration-200",
                                isActive
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                            title={mode.label}
                        >
                            {Icon ? <Icon size={14} /> : <Layout size={14} />}
                        </button>
                    );
                })}
            </div>
        );
    }

    // 标准模式：显示图标和标签
    return (
        <div className={cn("flex items-center gap-1 p-1 bg-slate-100 rounded-lg", className)}>
            {modeDetails.map((mode) => {
                const Icon = getIcon(mode.icon);
                const isActive = activeMode === mode.id;

                return (
                    <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleModeChange(mode.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-200",
                            isActive
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                        title={mode.description}
                    >
                        {Icon ? <Icon size={14} /> : <Layout size={14} />}
                        <span>{mode.label}</span>
                        {isActive && <Check size={12} className="text-emerald-500" />}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * useViewPreference - 视图偏好 Hook
 * 
 * 用于在组件中管理视图偏好
 */
export function useViewPreference(documentPath: string, availableModes: string[]) {
    const [activeMode, setActiveMode] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(getStorageKey(documentPath));
            if (saved && availableModes.includes(saved)) {
                return saved;
            }
        }
        return availableModes[0] || '';
    });

    const setMode = useCallback((mode: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(getStorageKey(documentPath), mode);
        }
        setActiveMode(mode);
    }, [documentPath]);

    // 当可用模式变化时，确保当前模式仍然有效
    useEffect(() => {
        if (availableModes.length > 0 && !availableModes.includes(activeMode)) {
            setMode(availableModes[0]);
        }
    }, [availableModes, activeMode, setMode]);

    return { activeMode, setMode };
}

export default ViewSwitcher;

