/**
 * AITalentMarketSettings - AI 人才市场页面
 * 
 * Phase 7.x: AI 人才市场
 * 
 * 功能：
 * - 浏览和雇佣 AI 员工
 * - 管理已雇佣的 AI 团队
 * - 查看 AI 员工工作状态
 * 
 * 样式参照插件市场
 */

import { useState, useMemo } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// 类型
import type { AITalent, HiredAI, TalentCategory, SortOption, ViewMode, TabType } from './types';

// 常量和数据
import { TALENT_CATEGORIES } from './constants';
import { HIRED_AI, MARKET_TALENTS, RECOMMENDED_TALENT_IDS } from './mock-data';

// 组件
import {
    PageHeader,
    Toolbar,
    HiredTalentCard,
    MarketTalentCard,
    TalentDetailModal,
    EmptyState,
} from './components';

// Hooks
import {
    useFilteredHired,
    useFilteredMarket,
    useCategoryCount,
    useRecommendedTalents,
} from './hooks';

// ============================================================
// 主组件
// ============================================================

export function AITalentMarketSettings() {
    // ==================== 状态 ====================
    const [activeTab, setActiveTab] = useState<TabType>('hired');
    const [selectedCategory, setSelectedCategory] = useState<TalentCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('rating');
    const [selectedTalent, setSelectedTalent] = useState<AITalent | HiredAI | null>(null);

    // ==================== 数据过滤 ====================
    
    // 过滤已雇佣的 AI
    const filteredHired = useFilteredHired(HIRED_AI, {
        selectedCategory,
        searchQuery,
    });

    // 获取已雇佣的 ID 集合（用于排除）
    const hiredIds = useMemo(
        () => new Set(HIRED_AI.map(ai => ai.id.split('-')[0])),
        []
    );

    // 过滤市场人才
    const filteredMarket = useFilteredMarket(MARKET_TALENTS, HIRED_AI, {
        selectedCategory,
        searchQuery,
        sortBy,
    });

    // 推荐人才
    const recommendedTalents = useRecommendedTalents(
        MARKET_TALENTS.filter(t => !hiredIds.has(t.id)),
        RECOMMENDED_TALENT_IDS
    );

    // 分类数量计算
    const getHiredCategoryCount = useCategoryCount(HIRED_AI);
    const getMarketCategoryCount = useCategoryCount(
        MARKET_TALENTS,
        hiredIds
    );

    // 根据当前 Tab 获取分类数量
    const getCategoryCount = (category: string) => {
        return activeTab === 'hired'
            ? getHiredCategoryCount(category as TalentCategory | 'all')
            : getMarketCategoryCount(category as TalentCategory | 'all');
    };

    // ==================== 事件处理 ====================

    const handleHire = (talent: AITalent) => {
        // TODO: 实现雇佣逻辑
        alert(`即将雇佣 ${talent.name}！`);
    };

    const handleFire = (talent: HiredAI) => {
        // TODO: 实现解雇逻辑
        alert(`确定要解雇 ${talent.name} 吗？`);
    };

    const handleConfigure = (talent: HiredAI) => {
        // TODO: 实现配置逻辑
        alert(`配置 ${talent.name}`);
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category as TalentCategory | 'all');
    };

    // ==================== 渲染 ====================

    return (
        <div className="h-full flex flex-col">
            {/* 页面头部 */}
            <PageHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                hiredCount={HIRED_AI.length}
                marketCount={MARKET_TALENTS.filter(t => !hiredIds.has(t.id)).length}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                getCategoryCount={getCategoryCount}
            />

            {/* 工具栏 */}
            <Toolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                showSort={activeTab === 'market'}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                activeTab={activeTab}
            />

            {/* 内容区域 */}
            <ScrollArea className="flex-1">
                <div className="p-4">
                    {activeTab === 'hired' ? (
                        /* 已雇佣的 AI 团队 */
                        <HiredContent
                            talents={filteredHired}
                            viewMode={viewMode}
                            onSelectTalent={setSelectedTalent}
                            onGoToMarket={() => setActiveTab('market')}
                        />
                    ) : (
                        /* 人才市场 */
                        <MarketContent
                            talents={filteredMarket}
                            recommendedTalents={recommendedTalents}
                            viewMode={viewMode}
                            selectedCategory={selectedCategory}
                            searchQuery={searchQuery}
                            onSelectTalent={setSelectedTalent}
                            onHire={handleHire}
                        />
                    )}
                </div>
            </ScrollArea>

            {/* 底部提示 */}
            <div className="p-3 border-t bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    {activeTab === 'hired'
                        ? 'AI 员工的所有操作都需要你的审批，数据安全有保障'
                        : '雇佣 AI 员工后，可在"我的团队"中管理和配置'}
                </span>
            </div>

            {/* 详情弹窗 */}
            <TalentDetailModal
                talent={selectedTalent}
                onClose={() => setSelectedTalent(null)}
                onHire={handleHire}
                onFire={handleFire}
                onConfigure={handleConfigure}
            />
        </div>
    );
}

// ============================================================
// 子内容组件
// ============================================================

interface HiredContentProps {
    talents: HiredAI[];
    viewMode: ViewMode;
    onSelectTalent: (talent: HiredAI) => void;
    onGoToMarket: () => void;
}

function HiredContent({ talents, viewMode, onSelectTalent, onGoToMarket }: HiredContentProps) {
    if (talents.length === 0) {
        return <EmptyState type="no-hired" onAction={onGoToMarket} />;
    }

    return (
        <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }>
            {talents.map(talent => (
                <HiredTalentCard
                    key={talent.id}
                    talent={talent}
                    onClick={() => onSelectTalent(talent)}
                />
            ))}
        </div>
    );
}

interface MarketContentProps {
    talents: AITalent[];
    recommendedTalents: AITalent[];
    viewMode: ViewMode;
    selectedCategory: TalentCategory | 'all';
    searchQuery: string;
    onSelectTalent: (talent: AITalent) => void;
    onHire: (talent: AITalent) => void;
}

function MarketContent({
    talents,
    recommendedTalents,
    viewMode,
    selectedCategory,
    searchQuery,
    onSelectTalent,
    onHire,
}: MarketContentProps) {
    const showRecommended = selectedCategory === 'all' && searchQuery === '' && recommendedTalents.length > 0;

    return (
        <>
            {/* 推荐区域 */}
            {showRecommended && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <h3 className="font-medium text-sm text-slate-900">推荐给你</h3>
                        <span className="text-xs text-slate-500">
                            根据你的业务场景智能推荐
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendedTalents.slice(0, 3).map(talent => (
                            <MarketTalentCard
                                key={talent.id}
                                talent={talent}
                                onClick={() => onSelectTalent(talent)}
                                onHire={() => onHire(talent)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 全部人才 */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium text-sm text-slate-900">
                        {selectedCategory === 'all'
                            ? '全部人才'
                            : TALENT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                    </h3>
                    <span className="text-xs text-slate-500">
                        {talents.length} 位
                    </span>
                </div>

                {talents.length === 0 ? (
                    <EmptyState type="no-results" />
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                        : 'space-y-3'
                    }>
                        {talents.map(talent => (
                            <MarketTalentCard
                                key={talent.id}
                                talent={talent}
                                onClick={() => onSelectTalent(talent)}
                                onHire={() => onHire(talent)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default AITalentMarketSettings;
