/**
 * AI 人才市场 - 类型定义
 */

// ============================================================
// 人才分类
// ============================================================

export type TalentCategory = 'executive' | 'operations' | 'creative' | 'professional';

// ============================================================
// AI 人才基础接口
// ============================================================

export interface AITalent {
    id: string;
    name: string;
    avatar: string;
    title: string;
    description: string;
    category: TalentCategory;
    capabilities: string[];
    personality: {
        archetype: string;
        tone: string;
        style: string;
    };
    sandbox: {
        read: string[];
        write: string[];
        deny: string[];
    };
    modelPreference: {
        provider: string;
        model: string;
    };
    schedule?: {
        daily?: string;
        weekly?: string;
    };
    price: TalentPrice;
    stats: TalentStats;
    isOfficial: boolean;
    tags: string[];
    version: string;
    updatedAt: string;
}

// ============================================================
// 已雇佣的 AI 接口
// ============================================================

export interface HiredAI extends AITalent {
    hiredAt: string;
    status: HiredStatus;
    activity: TalentActivity;
    nickname?: string;
}

// ============================================================
// 辅助类型
// ============================================================

export type HiredStatus = 'active' | 'paused' | 'onboarding';

export interface TalentPrice {
    type: 'free' | 'subscription' | 'one-time';
    amount?: number;
    tier?: string;
}

export interface TalentStats {
    hires: number;
    rating: number;
    reviews: number;
}

export interface TalentActivity {
    proposalsCreated: number;
    proposalsApproved: number;
    proposalsRejected: number;
    filesRead: number;
    lastActive: string;
}

// ============================================================
// 分类配置接口
// ============================================================

export interface TalentCategoryConfig {
    id: TalentCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
}

// ============================================================
// 筛选相关类型
// ============================================================

export type SortOption = 'rating' | 'hires' | 'updated';
export type ViewMode = 'grid' | 'list';
export type TabType = 'hired' | 'market';

