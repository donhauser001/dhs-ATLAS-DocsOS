/**
 * usePluginFilter - 插件过滤 Hook
 * 
 * Phase 4.1: 对接真实插件 API
 */

import { useMemo, useState, useEffect } from 'react';
import type { Plugin, PluginType, TypePackage, SortOption } from '../types';
import * as pluginsApi from '@/api/plugins';

interface UsePluginFilterProps {
    activePluginType: PluginType;
    searchQuery: string;
    selectedCategory: string;
    sortBy: SortOption;
}

interface PluginData {
    typePackages: Plugin[];
    themePackages: Plugin[];
    extensions: Plugin[];
}

export function usePluginFilter({
    activePluginType,
    searchQuery,
    selectedCategory,
    sortBy,
}: UsePluginFilterProps) {
    // 插件数据状态
    const [pluginData, setPluginData] = useState<PluginData>({
        typePackages: [],
        themePackages: [],
        extensions: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 加载插件数据
    useEffect(() => {
        let mounted = true;

        async function loadPlugins() {
            try {
                setLoading(true);
                setError(null);
                
                const data = await pluginsApi.getAllPlugins();
                
                if (mounted) {
                    setPluginData({
                        typePackages: data.typePackages || [],
                        themePackages: data.themePackages || [],
                        extensions: data.extensions || [],
                    });
                }
            } catch (err) {
                console.error('[usePluginFilter] Failed to load plugins:', err);
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load plugins');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadPlugins();

        return () => {
            mounted = false;
        };
    }, []);

    // 获取当前插件类型的所有插件
    const allPlugins = useMemo((): Plugin[] => {
        switch (activePluginType) {
            case 'type-package':
                return pluginData.typePackages;
            case 'theme-package':
                return pluginData.themePackages;
            case 'other':
                return pluginData.extensions;
            default:
                return [];
        }
    }, [activePluginType, pluginData]);

    // 过滤已安装的插件
    const installedPlugins = useMemo(() => {
        let filtered = allPlugins.filter(p => p.installed);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                p =>
                    p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    p.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // 类型包支持子分类过滤
        if (activePluginType === 'type-package' && selectedCategory !== 'all') {
            filtered = filtered.filter(p => (p as TypePackage).category === selectedCategory);
        }

        return filtered;
    }, [allPlugins, searchQuery, selectedCategory, activePluginType]);

    // 过滤市场插件（未安装的）
    const marketPlugins = useMemo(() => {
        let filtered = allPlugins.filter(p => !p.installed);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                p =>
                    p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    p.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // 类型包支持子分类过滤
        if (activePluginType === 'type-package' && selectedCategory !== 'all') {
            filtered = filtered.filter(p => (p as TypePackage).category === selectedCategory);
        }

        // 排序
        filtered.sort((a, b) => {
            if (sortBy === 'downloads') return b.downloads - a.downloads;
            if (sortBy === 'rating') return b.rating - a.rating;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return filtered;
    }, [allPlugins, searchQuery, selectedCategory, sortBy, activePluginType]);

    // 获取各插件类型的已安装数量
    const getPluginTypeCount = (type: PluginType): number => {
        switch (type) {
            case 'type-package':
                return pluginData.typePackages.filter(p => p.installed).length;
            case 'theme-package':
                return pluginData.themePackages.filter(p => p.installed).length;
            case 'other':
                return pluginData.extensions.filter(p => p.installed).length;
            default:
                return 0;
        }
    };

    return {
        allPlugins,
        installedPlugins,
        marketPlugins,
        getPluginTypeCount,
        loading,
        error,
    };
}

export default usePluginFilter;
