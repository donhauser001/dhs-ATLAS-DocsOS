/**
 * useTalentFilter - 人才筛选 Hook
 * 
 * 封装人才列表的筛选、搜索、排序逻辑
 */

import { useMemo } from 'react';
import type { AITalent, HiredAI, TalentCategory, SortOption } from '../types';

interface UseTalentFilterOptions {
    selectedCategory: TalentCategory | 'all';
    searchQuery: string;
    sortBy?: SortOption;
}

/**
 * 过滤已雇佣的 AI 员工
 */
export function useFilteredHired(
    hiredList: HiredAI[],
    options: UseTalentFilterOptions
): HiredAI[] {
    const { selectedCategory, searchQuery } = options;

    return useMemo(() => {
        return hiredList.filter(ai => {
            const matchesCategory = selectedCategory === 'all' || ai.category === selectedCategory;
            const matchesSearch = searchQuery === '' ||
                ai.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ai.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ai.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [hiredList, selectedCategory, searchQuery]);
}

/**
 * 过滤市场人才（排除已雇佣的）
 */
export function useFilteredMarket(
    marketList: AITalent[],
    hiredList: HiredAI[],
    options: UseTalentFilterOptions
): AITalent[] {
    const { selectedCategory, searchQuery, sortBy = 'rating' } = options;

    // 获取已雇佣的 ID 集合
    const hiredIds = useMemo(
        () => new Set(hiredList.map(ai => ai.id.split('-')[0])),
        [hiredList]
    );

    return useMemo(() => {
        return marketList
            .filter(talent => {
                const notHired = !hiredIds.has(talent.id);
                const matchesCategory = selectedCategory === 'all' || talent.category === selectedCategory;
                const matchesSearch = searchQuery === '' ||
                    talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    talent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    talent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                return notHired && matchesCategory && matchesSearch;
            })
            .sort((a, b) => {
                if (sortBy === 'rating') return b.stats.rating - a.stats.rating;
                if (sortBy === 'hires') return b.stats.hires - a.stats.hires;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
    }, [marketList, hiredIds, selectedCategory, searchQuery, sortBy]);
}

/**
 * 获取分类下的人才数量
 */
export function useCategoryCount(
    list: (AITalent | HiredAI)[],
    hiredIds?: Set<string>
) {
    return useMemo(() => {
        return (category: TalentCategory | 'all') => {
            let filteredList = list;
            
            // 如果提供了 hiredIds，排除已雇佣的
            if (hiredIds) {
                filteredList = list.filter(t => !hiredIds.has(t.id));
            }

            if (category === 'all') return filteredList.length;
            return filteredList.filter(t => t.category === category).length;
        };
    }, [list, hiredIds]);
}

/**
 * 获取推荐人才
 */
export function useRecommendedTalents(
    marketList: AITalent[],
    recommendedIds: string[]
): AITalent[] {
    return useMemo(() => {
        return marketList.filter(t => t.isOfficial && recommendedIds.includes(t.id));
    }, [marketList, recommendedIds]);
}

