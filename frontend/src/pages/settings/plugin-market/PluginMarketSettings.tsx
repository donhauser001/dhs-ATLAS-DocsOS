/**
 * PluginMarketSettings - 插件市场页面
 * 
 * Phase 4.1: 类型插件包与数据块资产池
 * 
 * 插件类型：
 * - 类型包 (type-package): 文档类型模板，包含数据块定义
 * - 主题包 (theme-package): 界面主题和样式
 * - 其他 (other): 其他扩展功能
 */

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { PluginType, TabType, ViewMode, SortOption, Plugin } from './types';
import {
    PageHeader,
    Toolbar,
    EmptyState,
    PluginGrid,
    Footer,
    PluginSettingsDialog,
} from './components';
import { usePluginFilter } from './hooks';

export function PluginMarketSettings() {
    // 插件类型
    const [activePluginType, setActivePluginType] = useState<PluginType>('type-package');
    // 安装状态 Tab
    const [activeTab, setActiveTab] = useState<TabType>('installed');
    // 搜索和过滤
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('downloads');
    // 设置对话框
    const [settingsPlugin, setSettingsPlugin] = useState<Plugin | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // 使用过滤 Hook（真实 API）
    const { installedPlugins, marketPlugins, getPluginTypeCount, loading, error } = usePluginFilter({
        activePluginType,
        searchQuery,
        selectedCategory,
        sortBy,
    });

    const handleInstall = (id: string) => {
        console.log('Install plugin:', id);
        // TODO: 实现安装逻辑
    };

    const handleView = (id: string) => {
        console.log('View plugin:', id);
        // TODO: 实现查看详情
    };

    const handleSettings = (plugin: Plugin) => {
        setSettingsPlugin(plugin);
        setSettingsOpen(true);
    };

    // 当切换插件类型时，重置分类选择
    const handlePluginTypeChange = (type: PluginType) => {
        setActivePluginType(type);
        setSelectedCategory('all');
        setActiveTab('installed');
    };

    const currentPlugins = activeTab === 'installed' ? installedPlugins : marketPlugins;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <PageHeader
                activePluginType={activePluginType}
                onPluginTypeChange={handlePluginTypeChange}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                installedCount={installedPlugins.length}
                marketCount={marketPlugins.length}
                getPluginTypeCount={getPluginTypeCount}
            />

            {/* Toolbar */}
            <Toolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
                activePluginType={activePluginType}
                activeTab={activeTab}
            />

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 pt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">加载插件...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-destructive">
                            <p>加载失败: {error}</p>
                            <button
                                className="mt-2 text-sm text-primary hover:underline"
                                onClick={() => window.location.reload()}
                            >
                                重试
                            </button>
                        </div>
                    ) : currentPlugins.length === 0 ? (
                        <EmptyState activeTab={activeTab} />
                    ) : (
                        <PluginGrid
                            plugins={currentPlugins}
                            viewMode={viewMode}
                            isMarket={activeTab === 'market'}
                            activePluginType={activePluginType}
                            onInstall={handleInstall}
                            onView={handleView}
                            onSettings={handleSettings}
                        />
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <Footer activePluginType={activePluginType} />

            {/* 插件设置对话框 */}
            <PluginSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                plugin={settingsPlugin}
            />
        </div>
    );
}

export default PluginMarketSettings;

