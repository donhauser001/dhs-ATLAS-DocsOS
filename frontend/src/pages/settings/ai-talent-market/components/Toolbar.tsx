/**
 * Toolbar - 工具栏组件
 * 
 * 包含搜索、排序、视图切换等功能
 * 样式参照插件市场
 */

import { Search, Grid3X3, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ViewMode, SortOption, TabType } from '../types';

interface ToolbarProps {
    // 搜索
    searchQuery: string;
    onSearchChange: (query: string) => void;
    // 排序
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    showSort: boolean;
    // 视图模式
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    // 当前标签页
    activeTab: TabType;
}

export function Toolbar({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    showSort,
    viewMode,
    onViewModeChange,
}: ToolbarProps) {
    return (
        <div className="px-4 pb-4 bg-white flex items-center gap-3">
            {/* 搜索 */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="搜索人才..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* 视图切换 */}
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

            {/* 排序（仅市场页面显示） */}
            {showSort && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Filter className="h-3.5 w-3.5" />
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
                    >
                        <option value="rating">评分</option>
                        <option value="hires">雇佣数</option>
                        <option value="updated">更新时间</option>
                    </select>
                </div>
            )}
        </div>
    );
}

export default Toolbar;
