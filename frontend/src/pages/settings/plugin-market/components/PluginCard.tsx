/**
 * PluginCard - 插件卡片组件
 */

import { Button } from '@/components/ui/button';
import {
    Package,
    Download,
    Check,
    Star,
    Info,
    ChevronRight,
    Settings,
} from 'lucide-react';
import type { Plugin, TypePackage } from '../types';
import { ICON_MAP } from '../constants';

interface PluginCardProps {
    plugin: Plugin;
    onInstall?: (id: string) => void;
    onView?: (id: string) => void;
    onSettings?: (plugin: Plugin) => void;
    compact?: boolean;
}

export function PluginCard({ plugin, onInstall, onView, onSettings, compact = false }: PluginCardProps) {
    const IconComponent = ICON_MAP[plugin.icon] || Package;

    // 获取插件特有信息
    const getPluginSpecificInfo = () => {
        if (plugin.pluginType === 'type-package') {
            return `${(plugin as TypePackage).blocksCount} 数据块`;
        } else if (plugin.pluginType === 'theme-package') {
            const modeText = plugin.mode === 'light' ? '浅色' : plugin.mode === 'dark' ? '深色' : '双模式';
            return modeText;
        } else {
            return `${plugin.capabilities.length} 个能力`;
        }
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:border-slate-300 hover:bg-slate-50/50 transition-all group">
                {/* 图标 */}
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${plugin.color}15` }}
                >
                    <IconComponent className="h-5 w-5" style={{ color: plugin.color }} />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{plugin.name}</span>
                        {plugin.isOfficial && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded">官方</span>
                        )}
                        {plugin.installed && (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                        )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{plugin.description}</div>
                </div>

                {/* 操作 */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {plugin.installed && plugin.pluginType === 'type-package' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => onSettings?.(plugin)}
                        >
                            <Settings className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => onView?.(plugin.id)}
                    >
                        <Info className="h-3.5 w-3.5" />
                    </Button>
                    {!plugin.installed && (
                        <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onInstall?.(plugin.id)}
                        >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            安装
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group bg-white">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${plugin.color}15` }}
                >
                    <IconComponent className="h-6 w-6" style={{ color: plugin.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{plugin.name}</h3>
                        {plugin.isOfficial && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded font-medium">
                                官方
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>v{plugin.version}</span>
                        <span>·</span>
                        <span>{plugin.author}</span>
                    </div>
                </div>
            </div>

            {/* 主题预览颜色 */}
            {plugin.pluginType === 'theme-package' && (
                <div className="flex gap-1 mb-3">
                    {plugin.previewColors.map((color, i) => (
                        <div
                            key={i}
                            className="w-8 h-8 rounded-md border"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            )}

            {/* Description */}
            <p className="text-sm text-slate-600 mb-3 line-clamp-2 min-h-[40px]">
                {plugin.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {plugin.tags.slice(0, 3).map((tag) => (
                    <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full"
                    >
                        {tag}
                    </span>
                ))}
                {plugin.tags.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-slate-400">
                        +{plugin.tags.length - 3}
                    </span>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span>{plugin.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    <span>{plugin.downloads}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    <span>{getPluginSpecificInfo()}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {plugin.installed ? (
                    <>
                        {/* 类型包显示设置按钮 */}
                        {plugin.pluginType === 'type-package' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onSettings?.(plugin)}
                            >
                                <Settings className="h-4 w-4 mr-1.5" />
                                设置
                            </Button>
                        )}
                        {plugin.pluginType !== 'type-package' && (
                            <Button size="sm" variant="outline" className="flex-1" disabled>
                                <Check className="h-4 w-4 mr-1.5 text-green-500" />
                                已安装
                            </Button>
                        )}
                    </>
                ) : (
                    <Button size="sm" className="flex-1" onClick={() => onInstall?.(plugin.id)}>
                        <Download className="h-4 w-4 mr-1.5" />
                        安装
                    </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onView?.(plugin.id)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default PluginCard;

