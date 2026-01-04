/**
 * MarketTalentCard - 市场人才卡片组件
 * 
 * 显示可雇佣 AI 人才的信息
 * 样式参照插件市场
 */

import { BadgeCheck, Star, Users, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AITalent } from '../types';
import { getCategoryColor } from '../constants';
import { PriceTag } from './PriceTag';

interface MarketTalentCardProps {
    talent: AITalent;
    onClick?: () => void;
    onHire?: () => void;
}

export function MarketTalentCard({ talent, onClick, onHire }: MarketTalentCardProps) {
    const categoryColor = getCategoryColor(talent.category);

    const handleHire = (e: React.MouseEvent) => {
        e.stopPropagation();
        onHire?.();
    };

    return (
        <div
            className="border rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group bg-white cursor-pointer"
            onClick={onClick}
        >
            {/* 头部 */}
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: categoryColor + '15' }}
                >
                    {talent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-sm text-slate-900 truncate">
                            {talent.name}
                        </h3>
                        {talent.isOfficial && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500">{talent.title}</p>
                </div>
                <div className="text-right text-sm font-medium">
                    <PriceTag price={talent.price} />
                </div>
            </div>

            {/* 描述 */}
            <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                {talent.description}
            </p>

            {/* 统计 */}
            <div className="flex items-center gap-3 mb-3 text-xs">
                <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="font-medium">{talent.stats.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>{talent.stats.hires.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{talent.stats.reviews}</span>
                </div>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-1 mb-3">
                {talent.tags.slice(0, 4).map((tag, i) => (
                    <span
                        key={i}
                        className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* 雇佣按钮 */}
            <Button
                size="sm"
                className="w-full gap-1.5 h-8 text-xs"
                variant="outline"
                onClick={handleHire}
            >
                <UserPlus className="h-3.5 w-3.5" />
                雇佣
            </Button>
        </div>
    );
}

export default MarketTalentCard;
