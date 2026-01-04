/**
 * PluginGrid - 插件网格/列表组件
 */

import { Star, Grid3X3 } from 'lucide-react';
import type { Plugin, PluginType, ViewMode } from '../types';
import { PLUGIN_TYPES } from '../constants';
import { PluginCard } from './PluginCard';

interface PluginGridProps {
    plugins: Plugin[];
    viewMode: ViewMode;
    isMarket?: boolean;
    activePluginType: PluginType;
    onInstall?: (id: string) => void;
    onView?: (id: string) => void;
    onSettings?: (plugin: Plugin) => void;
}

export function PluginGrid({
    plugins,
    viewMode,
    isMarket = false,
    activePluginType,
    onInstall,
    onView,
    onSettings,
}: PluginGridProps) {
    if (isMarket) {
        const officialPlugins = plugins.filter(p => p.isOfficial);

        return (
            <>
                {/* 推荐区域 */}
                {officialPlugins.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            官方推荐
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {officialPlugins.slice(0, 3).map((plugin) => (
                                <PluginCard
                                    key={plugin.id}
                                    plugin={plugin}
                                    onInstall={onInstall}
                                    onView={onView}
                                    onSettings={onSettings}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 全部列表 */}
                <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        全部{PLUGIN_TYPES.find(t => t.id === activePluginType)?.label}
                        <span className="text-xs text-slate-400">
                            ({plugins.length})
                        </span>
                    </h3>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {plugins.map((plugin) => (
                                <PluginCard
                                    key={plugin.id}
                                    plugin={plugin}
                                    onInstall={onInstall}
                                    onView={onView}
                                    onSettings={onSettings}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {plugins.map((plugin) => (
                                <PluginCard
                                    key={plugin.id}
                                    plugin={plugin}
                                    onInstall={onInstall}
                                    onView={onView}
                                    onSettings={onSettings}
                                    compact
                                />
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // 已安装列表
    return viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plugins.map((plugin) => (
                <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onView={onView}
                    onSettings={onSettings}
                />
            ))}
        </div>
    ) : (
        <div className="space-y-2">
            {plugins.map((plugin) => (
                <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onView={onView}
                    onSettings={onSettings}
                    compact
                />
            ))}
        </div>
    );
}

export default PluginGrid;

