/**
 * PageHeader - 页面头部组件
 * 
 * 包含标题、插件类型选择器、Tab 切换
 */

import { Package, Check, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PluginType, TabType } from '../types';
import { PLUGIN_TYPES } from '../constants';

interface PageHeaderProps {
    activePluginType: PluginType;
    onPluginTypeChange: (type: PluginType) => void;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    installedCount: number;
    marketCount: number;
    getPluginTypeCount: (type: PluginType) => number;
}

export function PageHeader({
    activePluginType,
    onPluginTypeChange,
    activeTab,
    onTabChange,
    installedCount,
    marketCount,
    getPluginTypeCount,
}: PageHeaderProps) {
    return (
        <div className="p-4 bg-white">
            {/* 标题区域 */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        插件市场
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        浏览和安装插件，扩展系统能力
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    检查更新
                </Button>
            </div>

            {/* 插件类型选择器 */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                {PLUGIN_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = activePluginType === type.id;
                    const count = getPluginTypeCount(type.id);

                    return (
                        <button
                            key={type.id}
                            onClick={() => onPluginTypeChange(type.id)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all ${isActive
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: isActive ? `${type.color}20` : undefined }}
                            >
                                <Icon className="h-4 w-4" style={{ color: isActive ? type.color : undefined }} />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-sm flex items-center gap-1.5">
                                    {type.label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary/20' : 'bg-slate-200'
                                        }`}>
                                        {count}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500">{type.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Tab 切换 */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-md w-fit">
                <button
                    onClick={() => onTabChange('installed')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'installed'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Check className="h-4 w-4" />
                    已安装
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-200 rounded-full">
                        {installedCount}
                    </span>
                </button>
                <button
                    onClick={() => onTabChange('market')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'market'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <TrendingUp className="h-4 w-4" />
                    市场
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-200 rounded-full">
                        {marketCount}
                    </span>
                </button>
            </div>
        </div>
    );
}

export default PageHeader;

