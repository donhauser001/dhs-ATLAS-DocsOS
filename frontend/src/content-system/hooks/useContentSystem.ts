/**
 * useContentSystem - 内容系统 React Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { InstalledPlugin, PluginType, ContentSystemState } from '../types';
import { getContentLoader } from '../ContentLoader';

interface UseContentSystemResult {
    /** 加载状态 */
    loading: boolean;
    /** 错误信息 */
    error: string | null;
    /** 系统状态 */
    state: ContentSystemState | null;
    /** 所有插件 */
    plugins: InstalledPlugin[];
    /** 类型包 */
    typePackages: InstalledPlugin[];
    /** 主题包 */
    themePackages: InstalledPlugin[];
    /** 扩展插件 */
    extensions: InstalledPlugin[];
    /** 当前主题 */
    activeTheme: InstalledPlugin | undefined;
    /** 刷新插件 */
    refresh: () => Promise<void>;
    /** 启用插件 */
    enablePlugin: (id: string) => void;
    /** 禁用插件 */
    disablePlugin: (id: string) => void;
    /** 设置主题 */
    setTheme: (id: string) => void;
    /** 根据 ID 获取插件 */
    getPlugin: (id: string) => InstalledPlugin | undefined;
}

export function useContentSystem(): UseContentSystemResult {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<ContentSystemState | null>(null);

    const loader = getContentLoader();

    // 刷新插件
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await loader.scanPlugins();
            setState(loader.getState());
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载插件失败');
        } finally {
            setLoading(false);
        }
    }, [loader]);

    // 初始加载
    useEffect(() => {
        refresh();
    }, [refresh]);

    // 启用插件
    const enablePlugin = useCallback((id: string) => {
        loader.enablePlugin(id);
        setState(loader.getState());
    }, [loader]);

    // 禁用插件
    const disablePlugin = useCallback((id: string) => {
        loader.disablePlugin(id);
        setState(loader.getState());
    }, [loader]);

    // 设置主题
    const setTheme = useCallback((id: string) => {
        loader.setActiveTheme(id);
        setState(loader.getState());
    }, [loader]);

    // 获取插件
    const getPlugin = useCallback((id: string) => {
        return loader.getPluginById(id);
    }, [loader]);

    return {
        loading,
        error,
        state,
        plugins: state?.plugins || [],
        typePackages: loader.getTypePackages(),
        themePackages: loader.getThemePackages(),
        extensions: loader.getExtensions(),
        activeTheme: loader.getActiveTheme(),
        refresh,
        enablePlugin,
        disablePlugin,
        setTheme,
        getPlugin,
    };
}

export default useContentSystem;

