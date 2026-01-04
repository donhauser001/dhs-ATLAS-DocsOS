/**
 * PageHeader - 页面头部组件
 * 
 * 包含标题和标签页切换
 * 样式参照插件市场
 */

import { Users, Check, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TabType } from '../types';
import { TALENT_CATEGORIES } from '../constants';

interface PageHeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    hiredCount: number;
    marketCount: number;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    getCategoryCount: (category: string) => number;
}

export function PageHeader({
    activeTab,
    onTabChange,
    hiredCount,
    marketCount,
    selectedCategory,
    onCategoryChange,
    getCategoryCount,
}: PageHeaderProps) {
    return (
        <div className="p-4 bg-white">
            {/* 标题区域 */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        AI 人才市场
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        组建你的虚拟团队，让 AI 员工帮你打理一切
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    刷新
                </Button>
            </div>

            {/* 人才分类选择器 */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                {/* 全部 */}
                <button
                    onClick={() => onCategoryChange('all')}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all ${selectedCategory === 'all'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: selectedCategory === 'all' ? '#3B82F620' : undefined, color: selectedCategory === 'all' ? '#3B82F6' : undefined }}
                    >
                        <Users className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-sm flex items-center gap-1.5">
                            全部
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-primary/20' : 'bg-slate-200'
                                }`}>
                                {getCategoryCount('all')}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500">所有人才</div>
                    </div>
                </button>

                {/* 分类按钮 */}
                {TALENT_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    const count = getCategoryCount(cat.id);

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryChange(cat.id)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all ${isActive
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: isActive ? `${cat.color}20` : undefined, color: isActive ? cat.color : undefined }}
                            >
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-sm flex items-center gap-1.5">
                                    {cat.label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary/20' : 'bg-slate-200'
                                        }`}>
                                        {count}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500">{cat.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Tab 切换 */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-md w-fit">
                <button
                    onClick={() => onTabChange('hired')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'hired'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Check className="h-4 w-4" />
                    我的团队
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-200 rounded-full">
                        {hiredCount}
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
                    人才市场
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-200 rounded-full">
                        {marketCount}
                    </span>
                </button>
            </div>
        </div>
    );
}

export default PageHeader;
