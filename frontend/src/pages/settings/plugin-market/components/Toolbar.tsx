/**
 * Toolbar - 工具栏组件
 * 
 * 包含搜索、分类过滤、视图切换、排序
 */

import { Search, Filter, Grid3X3, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PluginType, TabType, ViewMode, SortOption } from '../types';
import { TYPE_CATEGORIES } from '../constants';

interface ToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    activePluginType: PluginType;
    activeTab: TabType;
}

export function Toolbar({
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    viewMode,
    onViewModeChange,
    sortBy,
    onSortChange,
    activePluginType,
    activeTab,
}: ToolbarProps) {
    return (
        <div className="flex items-center gap-3 p-4 pt-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="搜索插件..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Category Filter - 仅类型包显示 */}
            {activePluginType === 'type-package' && (
                <div className="flex items-center gap-1 border rounded-lg p-1">
                    {TYPE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <Button
                                key={cat.id}
                                size="sm"
                                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                                className="h-7 px-2.5 text-xs"
                                onClick={() => onCategoryChange(cat.id)}
                            >
                                <Icon className="h-3.5 w-3.5 mr-1" />
                                {cat.label}
                            </Button>
                        );
                    })}
                </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className="h-7 w-7 p-0"
                    onClick={() => onViewModeChange('grid')}
                >
                    <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    className="h-7 w-7 p-0"
                    onClick={() => onViewModeChange('list')}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>

            {/* Sort (only in market tab) */}
            {activeTab === 'market' && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Filter className="h-3.5 w-3.5" />
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
                    >
                        <option value="downloads">下载量</option>
                        <option value="rating">评分</option>
                        <option value="updated">更新时间</option>
                    </select>
                </div>
            )}
        </div>
    );
}

export default Toolbar;

