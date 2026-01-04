/**
 * AI 人才市场模块
 * 
 * 导出主组件和相关类型
 */

// 主组件
export { AITalentMarketSettings, default } from './AITalentMarketSettings';

// 类型导出
export type {
    AITalent,
    HiredAI,
    TalentCategory,
    TalentCategoryConfig,
    TalentPrice,
    TalentStats,
    TalentActivity,
    HiredStatus,
    SortOption,
    ViewMode,
    TabType,
} from './types';

// 常量导出
export { TALENT_CATEGORIES, getCategoryConfig, getCategoryColor } from './constants';

// 组件导出（供外部使用）
export {
    StatusBadge,
    PriceTag,
    HiredTalentCard,
    MarketTalentCard,
    TalentDetailModal,
    CategoryFilter,
    Toolbar,
    PageHeader,
    EmptyState,
} from './components';

// Hooks 导出
export {
    useFilteredHired,
    useFilteredMarket,
    useCategoryCount,
    useRecommendedTalents,
} from './hooks';

