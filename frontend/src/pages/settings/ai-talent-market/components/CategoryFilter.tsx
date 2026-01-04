/**
 * CategoryFilter - 分类筛选组件
 * 
 * 用于筛选人才分类
 */

import type { TalentCategory } from '../types';
import { TALENT_CATEGORIES } from '../constants';

interface CategoryFilterProps {
    selected: TalentCategory | 'all';
    onChange: (category: TalentCategory | 'all') => void;
    getCategoryCount: (category: TalentCategory | 'all') => number;
}

export function CategoryFilter({
    selected,
    onChange,
    getCategoryCount,
}: CategoryFilterProps) {
    return (
        <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
            {/* 全部按钮 */}
            <button
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selected === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => onChange('all')}
            >
                全部
                <span className="ml-1 text-xs opacity-70">
                    {getCategoryCount('all')}
                </span>
            </button>

            {/* 分类按钮 */}
            {TALENT_CATEGORIES.map((cat) => (
                <button
                    key={cat.id}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        selected === cat.id
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => onChange(cat.id)}
                >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.label}
                    <span className="text-xs opacity-70">
                        {getCategoryCount(cat.id)}
                    </span>
                </button>
            ))}
        </div>
    );
}

export default CategoryFilter;

