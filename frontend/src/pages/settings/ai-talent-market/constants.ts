/**
 * AI 人才市场 - 常量定义
 */

import { Crown, Headphones, PenTool, Scale } from 'lucide-react';
import type { TalentCategoryConfig, TalentCategory } from './types';

// ============================================================
// 人才分类配置
// ============================================================

export const TALENT_CATEGORIES: TalentCategoryConfig[] = [
    {
        id: 'executive',
        label: '高管团队',
        icon: Crown,
        description: 'CEO/CFO/传记官/纠错官',
        color: '#F59E0B',
    },
    {
        id: 'operations',
        label: '运营助手',
        icon: Headphones,
        description: '客服/仓管/发货',
        color: '#10B981',
    },
    {
        id: 'creative',
        label: '创作团队',
        icon: PenTool,
        description: '文案/设计/翻译',
        color: '#8B5CF6',
    },
    {
        id: 'professional',
        label: '专业顾问',
        icon: Scale,
        description: '法务/财税/HR',
        color: '#3B82F6',
    },
];

// ============================================================
// 辅助函数
// ============================================================

/**
 * 根据分类 ID 获取分类配置
 */
export function getCategoryConfig(categoryId: TalentCategory): TalentCategoryConfig | undefined {
    return TALENT_CATEGORIES.find(c => c.id === categoryId);
}

/**
 * 获取分类颜色
 */
export function getCategoryColor(categoryId: TalentCategory): string {
    return getCategoryConfig(categoryId)?.color || '#6B7280';
}

